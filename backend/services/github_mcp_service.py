import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests
from jose import JWTError, jwt


GITHUB_API_URL = "https://api.github.com"
DEFAULT_MCP_URL = "https://api.githubcopilot.com/mcp/"


def github_mcp_configured():
    required_values = (
        os.getenv("GITHUB_APP_ID"),
        os.getenv("GITHUB_APP_SLUG"),
        os.getenv("GITHUB_APP_PRIVATE_KEY"),
        os.getenv("SECRET_KEY"),
    )
    return all(required_values)


def build_installation_url(user_id):
    if not github_mcp_configured():
        raise ValueError("GitHub MCP is not configured on this deployment.")

    state = _create_state(user_id)
    query = urlencode({"state": state})
    return f"https://github.com/apps/{os.environ['GITHUB_APP_SLUG']}/installations/new?{query}"


def read_installation_state(state):
    try:
        payload = jwt.decode(state, os.environ["SECRET_KEY"], algorithms=["HS256"])
    except (JWTError, KeyError) as error:
        raise ValueError("The GitHub connection request has expired.") from error

    if payload.get("purpose") != "github_install":
        raise ValueError("Invalid GitHub connection request.")
    return int(payload["user_id"])


def get_installation_details(installation_id):
    response = requests.get(
        f"{GITHUB_API_URL}/app/installations/{installation_id}",
        headers=_app_headers(),
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def create_installation_token(installation_id):
    response = requests.post(
        f"{GITHUB_API_URL}/app/installations/{installation_id}/access_tokens",
        headers=_app_headers(),
        timeout=20,
    )
    response.raise_for_status()
    return response.json()["token"]


def list_installation_repositories(token):
    response = requests.get(
        f"{GITHUB_API_URL}/installation/repositories",
        headers=_token_headers(token),
        params={"per_page": 100},
        timeout=20,
    )
    response.raise_for_status()

    repositories = []
    for repository in response.json().get("repositories", []):
        repositories.append({
            "full_name": repository["full_name"],
            "owner": repository["owner"]["login"],
            "name": repository["name"],
            "url": repository["html_url"],
            "description": repository.get("description"),
            "private": repository["private"],
        })
    return repositories


async def fetch_repository_evidence(token, repository):
    owner, name = repository["full_name"].split("/", 1)

    readme = await _call_mcp_tool(
        token,
        "get_file_contents",
        {"owner": owner, "repo": name, "path": "README.md"},
    )
    tree = await _call_mcp_tool(
        token,
        "get_repository_tree",
        {"owner": owner, "repo": name, "recursive": True},
    )

    return {
        "owner": owner,
        "name": name,
        "url": repository["url"],
        "readme": readme,
        "files": [tree],
        "retrieved_with": "official_github_mcp",
    }


async def _call_mcp_tool(token, tool_name, arguments):
    import httpx
    from mcp import ClientSession
    from mcp.client.streamable_http import streamable_http_client

    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "CareerPilot",
    }
    async with httpx.AsyncClient(headers=headers, timeout=30) as http_client:
        async with streamable_http_client(
            os.getenv("GITHUB_MCP_URL", DEFAULT_MCP_URL),
            http_client=http_client,
        ) as streams:
            read_stream, write_stream = streams[0], streams[1]
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)
                return _mcp_result_text(result)


def _mcp_result_text(result):
    structured = getattr(result, "structuredContent", None)
    if structured is None:
        structured = getattr(result, "structured_content", None)
    if structured:
        return str(structured)

    text_parts = []
    for item in getattr(result, "content", []):
        if hasattr(item, "text"):
            text_parts.append(item.text)
    return "\n".join(text_parts)


def _create_state(user_id):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "user_id": user_id,
            "purpose": "github_install",
            "iat": now,
            "exp": now + timedelta(minutes=15),
        },
        os.environ["SECRET_KEY"],
        algorithm="HS256",
    )


def _app_headers():
    now = datetime.now(timezone.utc)
    private_key = os.environ["GITHUB_APP_PRIVATE_KEY"].replace("\\n", "\n")
    app_token = jwt.encode(
        {
            "iat": now - timedelta(seconds=30),
            "exp": now + timedelta(minutes=9),
            "iss": os.environ["GITHUB_APP_ID"],
        },
        private_key,
        algorithm="RS256",
    )
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {app_token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "CareerPilot",
    }


def _token_headers(token):
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "CareerPilot",
    }
