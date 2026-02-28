import { EditorNode, TemplateData } from "@/domain/models/Template";
import { Html, Body, Head, Tailwind, Text, Button as ReactEmailButton, Img, Container, Section, Hr, Row, Column, Link } from "@react-email/components";
import { render } from "@react-email/render";
import * as React from "react";
import { generateTailwindConfig } from "./utils/cssParser";

// ── Simple SVG chart generator (no browser APIs, works server-side) ──
function generateChartSvg(
  data: { name: string; value: number }[],
  colors: string[],
  chartType: string,
  width = 560,
  height = 260
): string {
  const paddingLeft = 45;
  const paddingBottom = 30;
  const paddingTop = 10;
  const paddingRight = 10;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingBottom - paddingTop;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (chartType === "pie") {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(cx, cy) - 30;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let startAngle = -Math.PI / 2;
    const slices = data.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const lx = cx + (r + 16) * Math.cos(startAngle + angle / 2);
      const ly = cy + (r + 16) * Math.sin(startAngle + angle / 2);
      const large = angle > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      startAngle = endAngle;
      return { path, fill: colors[i % colors.length], name: d.name, lx, ly };
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${slices.map((s) => `<path d="${s.path}" fill="${s.fill}" stroke="white" stroke-width="1.5"/>`).join("")}
      ${slices.map((s) => `<text x="${s.lx}" y="${s.ly}" font-size="11" text-anchor="middle" dominant-baseline="middle" fill="#374151">${s.name}</text>`).join("")}
    </svg>`;
  }

  if (chartType === "line") {
    const step = chartW / Math.max(data.length - 1, 1);
    const points = data.map((d, i) => ({
      x: paddingLeft + i * step,
      y: paddingTop + chartH - (d.value / maxValue) * chartH,
      name: d.name,
    }));
    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: paddingTop + chartH - t * chartH,
      label: Math.round(maxValue * t),
    }));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      ${yTicks.map((t) => `<line x1="${paddingLeft}" y1="${t.y}" x2="${width - paddingRight}" y2="${t.y}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="${paddingLeft - 6}" y="${t.y}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="#6b7280">${t.label}</text>`).join("")}
      <polyline points="${polyline}" fill="none" stroke="${colors[0]}" stroke-width="2.5" stroke-linejoin="round"/>
      ${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${colors[0]}"/>
      <text x="${p.x}" y="${paddingTop + chartH + 18}" font-size="11" text-anchor="middle" fill="#374151">${p.name}</text>`).join("")}
    </svg>`;
  }

  // bar (default)
  const barGap = 8;
  const barW = Math.max(4, (chartW / data.length) - barGap);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: paddingTop + chartH - t * chartH,
    label: Math.round(maxValue * t),
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="white"/>
    ${yTicks.map((t) => `<line x1="${paddingLeft}" y1="${t.y}" x2="${width - paddingRight}" y2="${t.y}" stroke="#e5e7eb" stroke-width="1"/>
    <text x="${paddingLeft - 6}" y="${t.y}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="#6b7280">${t.label}</text>`).join("")}
    ${data.map((d, i) => {
      const bh = (d.value / maxValue) * chartH;
      const bx = paddingLeft + i * (chartW / data.length) + barGap / 2;
      const by = paddingTop + chartH - bh;
      return `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" fill="${colors[i % colors.length]}" rx="2"/>
      <text x="${bx + barW / 2}" y="${paddingTop + chartH + 18}" font-size="11" text-anchor="middle" fill="#374151">${d.name}</text>`;
    }).join("")}
  </svg>`;
}

export function generateReactEmailElement(data: TemplateData, themeCSS: string = "") {
  const renderNode = (nodeId: string): React.ReactNode => {
    const node = data.nodes[nodeId];
    if (!node) return null;

    const children = node.children.map(renderNode);

    switch (node.type) {
      case "TEXT":
        return (
          <Text key={node.id} style={node.props.style}>
            {node.props.content}
          </Text>
        );
      case "BUTTON":
        return (
          <ReactEmailButton
            key={node.id}
            href={node.props.href}
            style={{
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              textAlign: "center",
              display: "inline-block",
              ...node.props.style,
              paddingTop: node.props.style?.paddingTop || "10px",
              paddingRight: node.props.style?.paddingRight || "20px",
              paddingBottom: node.props.style?.paddingBottom || "10px",
              paddingLeft: node.props.style?.paddingLeft || "20px",
            }}
          >
            {node.props.content}
          </ReactEmailButton>
        );
      case "IMAGE":
        return (
          <Img 
            key={node.id} 
            src={node.props.src} 
            alt={node.props.alt} 
            style={node.props.style} 
          />
        );
      case "CONTAINER":
        return (
          <Section key={node.id} style={node.props.style}>
            {children}
          </Section>
        );
      case "DIVIDER":
        return <Hr key={node.id} style={{ margin: "20px 0", borderColor: "#e2e8f0", ...node.props.style }} />;
      case "SPACER":
        return <Section key={node.id} style={{ height: node.props.height || "40px", ...node.props.style }} />;
      case "COLUMNS":
        // Wrapping children into columns
        return (
          <Row key={node.id} style={node.props.style}>
            {node.children.map((childId) => (
              <Column key={childId}>{renderNode(childId)}</Column>
            ))}
          </Row>
        );
      case "SOCIAL":
        return (
          <Row key={node.id} style={{ padding: "10px", ...node.props.style }}>
            <Column align="center">
              <Link href="#" style={{ display: "inline-block", padding: "8px", margin: "0 4px", backgroundColor: "#3b5998", color: "white", borderRadius: "50%", width: "16px", height: "16px", textAlign: "center", textDecoration: "none", lineHeight: "16px" }}>f</Link>
              <Link href="#" style={{ display: "inline-block", padding: "8px", margin: "0 4px", backgroundColor: "#1da1f2", color: "white", borderRadius: "50%", width: "16px", height: "16px", textAlign: "center", textDecoration: "none", lineHeight: "16px" }}>t</Link>
              <Link href="#" style={{ display: "inline-block", padding: "8px", margin: "0 4px", backgroundColor: "#2867B2", color: "white", borderRadius: "50%", width: "16px", height: "16px", textAlign: "center", textDecoration: "none", lineHeight: "16px" }}>in</Link>
            </Column>
          </Row>
        );
      case "CARD":
        return (
          <Section key={node.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", ...node.props.style }}>
            {node.props.cardTitle && (
              <Section style={{ padding: "24px 24px 0 24px" }}>
                <Text style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>{node.props.cardTitle}</Text>
                {node.props.cardDescription && (
                  <Text style={{ fontSize: "14px", color: "#6b7280", margin: "6px 0 0 0" }}>{node.props.cardDescription}</Text>
                )}
              </Section>
            )}
            <Section style={{ padding: "16px 24px" }}>
              {children}
            </Section>
          </Section>
        );
      case "TABLE": {
        const headers = node.props.headers || ["Header 1", "Header 2", "Header 3"];
        const rows = node.props.rows || [["Cell 1", "Cell 2", "Cell 3"]];
        return (
          <Section key={node.id} style={{ width: "100%", ...node.props.style }}>
            <Row style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {headers.map((h: string, i: number) => (
                <Column key={i} style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase" as const }}>{h}</Column>
              ))}
            </Row>
            {rows.map((row: string[], ri: number) => (
              <Row key={ri} style={{ borderBottom: "1px solid #e2e8f0" }}>
                {row.map((cell: string, ci: number) => (
                  <Column key={ci} style={{ padding: "16px", fontSize: "14px" }}>{cell}</Column>
                ))}
              </Row>
            ))}
          </Section>
        );
      }
      case "BADGE": {
        const variantStyles: Record<string, React.CSSProperties> = {
          default: { backgroundColor: "#f97316", color: "#ffffff" },
          secondary: { backgroundColor: "#f1f5f9", color: "#0f172a" },
          outline: { border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "transparent" },
          destructive: { backgroundColor: "#ef4444", color: "#ffffff" },
        };
        const v = node.props.variant || "default";
        return (
          <Text
            key={node.id}
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              lineHeight: "1.5",
              ...variantStyles[v],
              ...node.props.style,
            }}
          >
            {node.props.content || "Badge"}
          </Text>
        );
      }
      case "CHART": {
        const chartData = node.props.data || [{ name: "A", value: 4000 }, { name: "B", value: 3000 }];
        const colors = node.props.colors || ["#f97316", "#60a5fa", "#34d399", "#f59e0b"];
        const chartType = node.props.chartType || "bar";
        const w = 560;
        const h = 260;

        const svgString = generateChartSvg(chartData, colors, chartType, w, h);
        const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

        return (
          <Section key={node.id} style={{ width: "100%", ...node.props.style }}>
            {node.props.chartTitle && (
              <Text style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 8px 0" }}>
                {node.props.chartTitle}
              </Text>
            )}
            <Img src={dataUri} alt={node.props.chartTitle || "Chart"} width={w} height={h} style={{ display: "block", maxWidth: "100%" }} />
          </Section>
        );
      }
      case "ROOT":
        return (
          <Container key={node.id} style={node.props.style}>
            {children}
          </Container>
        );
      default:
        return null;
    }
  };

  const rootElement = renderNode(data.rootNodeId);

  return (
    <Html>
      <Head>
        <style>{`${themeCSS}`}</style>
        {/* You can load custom fonts here based on theme */}
      </Head>
      <Tailwind config={generateTailwindConfig(themeCSS)}>
        <Body style={{ backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
          {rootElement}
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function generateHtmlExport(data: TemplateData, themeCSS: string = ""): Promise<string> {
  const component = generateReactEmailElement(data, themeCSS);
  const html = await render(component, { pretty: false });
  return html;
}
