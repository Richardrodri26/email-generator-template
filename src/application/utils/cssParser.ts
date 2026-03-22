export function parseShadcnVariables(
  cssString: string,
): Record<string, string> {
  const variables: Record<string, string> = {};
  if (!cssString) return variables;

  // Only extract variables from the :root block.
  // Parsing all lines indiscriminately causes .dark and @theme inline blocks
  // to overwrite :root values, producing wrong colors in the export.
  const lines = cssString.split("\n");
  let inRootBlock = false;
  let braceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inRootBlock) {
      if (/^:root\s*\{/.test(trimmed)) {
        inRootBlock = true;
        braceDepth = 1;
      }
      continue;
    }

    // Track brace depth to detect end of :root block
    for (const ch of trimmed) {
      if (ch === "{") braceDepth++;
      else if (ch === "}") braceDepth--;
    }

    if (braceDepth <= 0) {
      inRootBlock = false;
      continue;
    }

    if (trimmed.startsWith("--") && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(2, colonIdx).trim(); // strip leading --
      const value = trimmed.slice(colonIdx + 1).replace(";", "").trim();
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
