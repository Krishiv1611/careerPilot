# services/skill_database.py

SKILL_VOCAB = [

    # -----------------------------
    # Programming Languages
    # -----------------------------
    "python", "java", "c", "c++", "c#", "go", "rust",
    "javascript", "typescript", "dart", "kotlin", "php", "ruby",
    "scala", "swift", "matlab", "r",

    # -----------------------------
    # Web Development
    # -----------------------------
    "html", "css", "sass", "bootstrap",
    "react", "next.js", "angular", "vue", "svelte",
    "node", "express", "fastapi", "django", "flask", "spring boot",
    "jquery", "redux", "tailwind",

    # -----------------------------
    # Databases
    # -----------------------------
    "sql", "mysql", "postgresql", "sqlite", "mongodb",
    "redis", "oracle", "cassandra", "dynamodb",

    # -----------------------------
    # Machine Learning / AI
    # -----------------------------
    "machine learning", "deep learning", "neural networks",
    "computer vision", "nlp", "reinforcement learning",
    "tensorflow", "keras", "pytorch", "sklearn",
    "xgboost", "lightgbm", "opencv", "transformers",
    "llm", "gpt", "bert",

    # -----------------------------
    # Data Engineering
    # -----------------------------
    "data engineering", "etl", "airflow", "kafka", "spark", "hadoop",
    "data modeling", "big data", "data pipelines",

    # -----------------------------
    # Cloud & DevOps
    # -----------------------------
    "docker", "kubernetes", "aws", "azure", "gcp",
    "terraform", "jenkins", "github actions", "ci/cd",
    "linux", "bash", "nginx",

    # -----------------------------
    # Data Tools
    # -----------------------------
    "pandas", "numpy", "matplotlib", "seaborn", "tableau",
    "power bi", "excel", "sql server",

    # -----------------------------
    # Cybersecurity
    # -----------------------------
    "cybersecurity", "penetration testing",
    "network security", "firewalls", "owasp",

    # -----------------------------
    # Testing / QA
    # -----------------------------
    "selenium", "pytest", "cypress", "postman",

    # -----------------------------
    # Version Control / Tools
    # -----------------------------
    "git", "github", "gitlab", "jira", "postman", "swagger",

    # -----------------------------
    # Soft Skills
    # -----------------------------
    "communication", "teamwork", "leadership",
    "problem solving", "critical thinking", "time management",
    "project management",
]
SKILL_ALIASES = {
    "js": "javascript",
    "py": "python",
    "nodejs": "node",
    "reactjs": "react",
    "ml": "machine learning",
    "dl": "deep learning",
    "postgres": "postgresql",
    "sqlserver": "sql server",
    "cpp": "c++",
    "csharp": "c#",
    "tf": "tensorflow",
    "np": "numpy",
    "cv": "computer vision",
}


# -----------------------------------
# Predefined Categories for resume
# -----------------------------------
SKILL_CATEGORIES = {
    "programming_languages": [
        "python", "java", "c", "c++", "c#", "go", "rust",
        "javascript", "typescript", "ruby", "scala", "swift",
        "matlab", "r", "dart", "php", "kotlin"
    ],

    "web_development": [
        "html", "css", "sass", "bootstrap",
        "react", "next.js", "angular", "vue", "svelte",
        "node", "express", "fastapi", "django", "flask", "spring boot",
        "jquery", "redux", "tailwind"
    ],

    "databases": [
        "sql", "mysql", "postgresql", "sqlite", "mongodb",
        "redis", "oracle", "cassandra", "dynamodb"
    ],

    "machine_learning_ai": [
        "machine learning", "deep learning", "neural networks",
        "nlp", "computer vision", "reinforcement learning",
        "tensorflow", "keras", "pytorch", "sklearn",
        "xgboost", "lightgbm", "opencv", "transformers",
        "llm", "gpt", "bert"
    ],

    "data_engineering": [
        "data engineering", "etl", "airflow", "kafka", "spark", "hadoop",
        "data modeling", "big data", "data pipelines"
    ],

    "devops_cloud": [
        "docker", "kubernetes", "aws", "azure", "gcp",
        "terraform", "jenkins", "github actions", "ci/cd",
        "linux", "bash", "nginx"
    ],

    "data_tools": [
        "pandas", "numpy", "matplotlib", "seaborn",
        "tableau", "power bi", "excel", "sql server"
    ],

    "cybersecurity": [
        "cybersecurity", "penetration testing", "network security",
        "firewalls", "owasp"
    ],

    "testing": [
        "selenium", "pytest", "cypress", "postman"
    ],

    "version_control": [
        "git", "github", "gitlab", "jira", "swagger"
    ],

    "soft_skills": [
        "communication", "teamwork", "leadership",
        "problem solving", "critical thinking",
        "time management", "project management"
    ],
}
