from difflib import SequenceMatcher


VALID_DECISIONS = {"accepted", "rejected"}


def build_line_changes(original_text, proposed_text):
    original_lines = _lines(original_text)
    proposed_lines = _lines(proposed_text)
    matcher = SequenceMatcher(a=original_lines, b=proposed_lines, autojunk=False)
    changes = []

    for tag, original_start, original_end, proposed_start, proposed_end in matcher.get_opcodes():
        if tag == "equal":
            continue

        changes.append({
            "id": f"change-{len(changes) + 1}",
            "kind": tag,
            "original_start": original_start,
            "original_end": original_end,
            "before_lines": original_lines[original_start:original_end],
            "after_lines": proposed_lines[proposed_start:proposed_end],
            "status": "pending",
            "source": "resume_evidence",
        })

    return changes


def apply_change_decisions(original_text, changes, decisions):
    unresolved = [change["id"] for change in changes if decisions.get(change["id"]) not in VALID_DECISIONS]
    if unresolved:
        raise ValueError("Review every proposed change before creating an approved version.")

    reviewed_changes = [
        {**change, "status": decisions[change["id"]]}
        for change in changes
    ]
    resolved_lines = _lines(original_text)

    for change in reversed(reviewed_changes):
        if change["status"] != "accepted":
            continue

        start = change["original_start"]
        end = change["original_end"]
        resolved_lines[start:end] = change["after_lines"]

    return {
        "content": "\n".join(resolved_lines),
        "changes": reviewed_changes,
        "all_resolved": True,
    }


def _lines(text):
    return [line.rstrip() for line in text.splitlines()]
