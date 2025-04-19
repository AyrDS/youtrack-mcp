import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const youtrackToken = process.argv[2];
const youtrackUrl = process.argv[3];

if (!youtrackToken || !youtrackUrl) {
  console.error(
    "❌ You must provide the token and the YouTrack URL as arguments."
  );
  process.exit(1);
}

const server = new McpServer({
  name: "youtrack-mcp",
  version: "0.0.1",
});

server.tool(
  "get_issues",
  "Get all the issues of a user",
  {
    user: z.string().describe("Youtrack user"),
  },

  async ({ user }) => {
    const userLogin: { login: string }[] = await fetch(
      `${youtrackUrl}/api/users?query=${user}&fields=login`,
      {
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
        },
      }
    ).then((res) => res.json());

    if (userLogin.length === 0) {
      return {
        content: [
          { type: "text", text: `User ${user} does not exist in Youtrack` },
        ],
      };
    }

    const response = await fetch(
      `${youtrackUrl}/api/issues?query=Assignee:${userLogin[0].login}&fields=idReadable,summary,project(name),created,updated&$top=100`,
      {
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
        },
      }
    );

    const issues = await response.json();

    if (issues.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No tasks found assigned to user ${user}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issues, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_issue",
  "Create a task in youtrack in a specific project",

  {
    projectName: z.string().describe("Project name"),
    summary: z.string().describe("Issue title or summary"),
    description: z.string().describe("Task description"),
    dueDate: z.string().describe("Task due date"),
    estimation: z.number().describe("Task estimation"),
  },

  async ({ description, summary, projectName, dueDate, estimation }) => {
    const date = new Date(dueDate);
    const timestamps = date.getTime();

    const allProjects: { name: string; id: string }[] = await fetch(
      `${youtrackUrl}/api/admin/projects?fields=id,name`,
      {
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());

    const projectId = allProjects.find((project) =>
      project.name.toLocaleLowerCase().includes(projectName.toLocaleLowerCase())
    );

    if (!projectId) {
      return {
        content: [
          {
            type: "text",
            text: `Project ${projectName} does not exist in Youtrack`,
          },
        ],
      };
    }

    const body = {
      project: {
        id: projectId.id,
      },
      summary,
      description,
      customFields: [
        {
          name: "Due Date",
          $type: "DateIssueCustomField",
          value: timestamps,
        },
        {
          name: "Estimation",
          $type: "PeriodIssueCustomField",
          value: {
            minutes: estimation,
          },
        },
      ],
    };

    try {
      const res = await fetch(`${youtrackUrl}/api/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${youtrackToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Task ${summary} has been created in project ${projectName}`,
            },
          ],
        };
      } else {
        const error = await res.json();
        return {
          content: [
            {
              type: "text",
              text: `Error creating task ${summary} in project ${projectName}. Error: ${JSON.stringify(
                error,
                null,
                2
              )}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating task ${summary} in project ${projectName}. Error: ${error}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
