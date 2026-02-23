import { EditorNode, TemplateData } from "@/domain/models/Template";
import { Html, Body, Head, Tailwind, Font, Text, Button as ReactEmailButton, Img, Container, Section, Hr, Row, Column, Link } from "@react-email/components";
import { render } from "@react-email/render";
import * as React from "react";
import { generateTailwindConfig } from "./utils/cssParser";

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
          <ReactEmailButton key={node.id} href={node.props.href} style={node.props.style}>
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
        <Body style={{ backgroundColor: "#ffffff" }}>
          {rootElement}
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function generateHtmlExport(data: TemplateData, themeCSS: string = ""): Promise<string> {
  const component = generateReactEmailElement(data, themeCSS);
  const html = await render(component);
  return html;
}
