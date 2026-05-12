import Groq from 'groq-sdk';

export const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_buildings',
      description: `
Use this tool whenever the user:
- asks about buildings
- requests building lists
- searches building by name/code
- asks active/inactive buildings
- asks building overview
`,
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Filter buildings by partial name or code',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_building_by_id',
      description: 'Get detailed information about a building by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_facilities',
      description: `
Use this tool whenever the user:
- asks about facilities
- asks about rooms/spaces
- searches facility by name/code
- asks facility status
- asks facilities in building
`,
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          building_id: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['available', 'maintenance', 'reserved'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_facility_by_id',
      description: 'Get detailed information about a facility by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_facilities',
      description: 'Get all available facilities. Use when user wants free/bookable facilities.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
