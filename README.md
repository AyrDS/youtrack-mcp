# YouTrack MCP Server

Work in progress of a model context protocol server to interface with JetBrains YouTrack

## Components

### Tools

- **get_issues**

  - Gets all issues of a user in YouTrack

- **create_issue**
  - Create an issue in a specific project

## Installation & Usage

1. Clone the repository

```
git clone https://github.com/AyrDS/youtrack-mcp.git
```

### NPX

```json
{
  "youtrack": {
    "command": "npx",
    "args": [
      "-y",
      "tsx",
      "/path/to/repository",
      "your-youtrack-api-token",
      "https://your-instance-youtrack.com"
    ]
  }
}
```

You must change arguments 4 and 5. (Token and URL).
