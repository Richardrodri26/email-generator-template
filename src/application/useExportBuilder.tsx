import { EditorNode, TemplateData } from "@/domain/models/Template";
import { Html, Body, Head, Tailwind, Font, Text, Button as ReactEmailButton, Img, Container, Section } from "@react-email/components";
import { render } from "@react-email/render";
import * as React from "react";

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
      <Tailwind>
        <Body style={{ backgroundColor: "#ffffff" }}>
          {rootElement}
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function generateHtmlExport(data: TemplateData, themeCSS: string = ""): Promise<string> {
  const component = generateReactEmailElement(data, themeCSS);
  const html = await render(component, { pretty: true });
  return html;
}
