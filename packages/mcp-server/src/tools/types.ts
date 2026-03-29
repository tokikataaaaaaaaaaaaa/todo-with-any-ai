export interface ToolResponse {
  [key: string]: unknown;
  isError?: boolean;
  content: Array<{
    type: "text";
    text: string;
  }>;
}
