export function parseShadcnVariables(
  cssString: string,
): Record<string, string> {
  const variables: Record<string, string> = {};
  if (!cssString) return variables;

  const lines = cssString.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && trimmed.includes(":")) {
      const parts = trimmed.split(":");
      let key = parts[0].trim();
      if (key.startsWith("--")) {
        key = key.substring(2);
      }
      const value = parts.slice(1).join(":").replace(";", "").trim();
      variables[key] = value;
    }
  }
  return variables;
}

export function generateTailwindConfig(cssString: string) {
  const vars = parseShadcnVariables(cssString);
  return {
    theme: {
      extend: {
        colors: {
          ...vars,
        },
      },
    },
  };
}
