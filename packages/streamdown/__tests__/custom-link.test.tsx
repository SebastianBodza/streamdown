import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import type { LinkComponentProps } from "../index";
import { Streamdown } from "../index";

describe("Custom Link Component", () => {
  describe("Basic Usage", () => {
    it("should render with default link component when no custom component provided", () => {
      const markdown = "[Link text](https://example.com)";
      const { container } = render(<Streamdown>{markdown}</Streamdown>);

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("Link text");
      expect(link?.getAttribute("href")).toBe("https://example.com/");
    });

    it("should use custom link component when provided", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          className="custom-link"
          data-is-internal={isInternal}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link text](https://example.com)";
      const { container } = render(
        <Streamdown link={{ component: CustomLink }}>
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.className).toContain("custom-link");
      expect(link?.textContent).toBe("Link text");
    });

    it("should pass className to custom link component", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        className,
      }) => (
        <a className={className} href={href}>
          {children}
        </a>
      );

      const markdown = "[Link text](https://example.com)";
      const { container } = render(
        <Streamdown link={{ component: CustomLink }}>
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.className).toContain("text-primary");
    });
  });

  describe("Internal vs External Links", () => {
    it("should mark links as internal when no allowedPrefixes set", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link](https://example.com)";
      const { container } = render(
        <Streamdown link={{ component: CustomLink }}>
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      expect(link?.getAttribute("data-is-internal")).toBe("true");
    });

    it("should mark links as internal when they match allowedPrefixes", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = `
[Internal 1](/docs/page)
[Internal 2](https://mysite.com/about)
[External](https://example.com)
      `;

      const { container } = render(
        <Streamdown
          link={{
            component: CustomLink,
            allowedPrefixes: ["/", "https://mysite.com"],
          }}
        >
          {markdown}
        </Streamdown>
      );

      const links = container.querySelectorAll("a");
      expect(links.length).toBe(3);

      // Internal link with "/"
      expect(links[0]?.getAttribute("data-is-internal")).toBe("true");
      expect(links[0]?.getAttribute("href")).toBe("/docs/page");

      // Internal link with "https://mysite.com"
      expect(links[1]?.getAttribute("data-is-internal")).toBe("true");
      expect(links[1]?.getAttribute("href")).toBe("https://mysite.com/about");

      // External link
      expect(links[2]?.getAttribute("data-is-internal")).toBe("false");
      expect(links[2]?.getAttribute("href")).toBe("https://example.com/");
    });

    it("should mark all links as external when empty allowedPrefixes", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link](/docs/page)";
      const { container } = render(
        <Streamdown
          link={{
            component: CustomLink,
            allowedPrefixes: [],
          }}
        >
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      // Empty allowedPrefixes means no prefixes match, so links are external
      expect(link?.getAttribute("data-is-internal")).toBe("false");
    });
  });

  describe("Dialog Pattern Example", () => {
    it("should support dialog pattern for external links", () => {
      const DialogLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => {
        if (isInternal) {
          return <a href={href}>{children}</a>;
        }

        return (
          <button
            data-dialog-trigger="true"
            data-external-url={href}
            type="button"
          >
            {children}
          </button>
        );
      };

      const markdown = `
[Internal](/docs)
[External](https://example.com)
      `;

      const { container } = render(
        <Streamdown
          link={{
            component: DialogLink,
            allowedPrefixes: ["/"],
          }}
        >
          {markdown}
        </Streamdown>
      );

      const internalLink = container.querySelector("a");
      expect(internalLink).toBeTruthy();
      expect(internalLink?.getAttribute("href")).toBe("/docs");

      const externalTrigger = container.querySelector("button");
      expect(externalTrigger).toBeTruthy();
      expect(externalTrigger?.getAttribute("data-dialog-trigger")).toBe("true");
      expect(externalTrigger?.getAttribute("data-external-url")).toBe(
        "https://example.com/"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle incomplete links", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      // Incomplete link - Remend will complete it with streamdown:incomplete-link
      const markdown = "[Link text](";
      const { container } = render(
        <Streamdown link={{ component: CustomLink }}>
          {markdown}
        </Streamdown>
      );

      // Check if there's any link rendered
      const link = container.querySelector("a");
      // Incomplete links may not render as links until they are completed
      // This is expected behavior
      if (link) {
        // If it does render, it should be marked as internal
        expect(link.getAttribute("data-is-internal")).toBe("true");
      } else {
        // If no link is rendered, that's also expected behavior for incomplete syntax
        expect(container.textContent).toContain("Link text");
      }
    });

    it("should handle links without href", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link text]()";
      const { container } = render(
        <Streamdown link={{ component: CustomLink }}>
          {markdown}
        </Streamdown>
      );

      // Empty href may not render a link element
      // Check if there's any link rendered
      const link = container.querySelector("a");
      if (link) {
        expect(link.getAttribute("data-is-internal")).toBe("true");
      } else {
        // If no link is rendered, that's expected behavior
        expect(container.textContent).toContain("Link text");
      }
    });

    it("should handle multiple links with mixed internal/external", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          className={isInternal ? "internal" : "external"}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = `
# Links

- [Home](/)
- [About](/about)
- [Docs](/docs)
- [GitHub](https://github.com)
- [Google](https://google.com)
      `;

      const { container } = render(
        <Streamdown
          link={{
            component: CustomLink,
            allowedPrefixes: ["/"],
          }}
        >
          {markdown}
        </Streamdown>
      );

      const links = container.querySelectorAll("a");
      expect(links.length).toBe(5);

      // Internal links
      expect(links[0]?.className).toContain("internal");
      expect(links[1]?.className).toContain("internal");
      expect(links[2]?.className).toContain("internal");

      // External links
      expect(links[3]?.className).toContain("external");
      expect(links[4]?.className).toContain("external");
    });
  });

  describe("Integration with Other Features", () => {
    it("should work with streaming mode", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link](https://example.com)";
      const { container } = render(
        <Streamdown
          link={{ component: CustomLink }}
          mode="streaming"
        >
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
    });

    it("should work with static mode", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
        isInternal,
      }) => (
        <a
          data-is-internal={String(isInternal)}
          href={href}
        >
          {children}
        </a>
      );

      const markdown = "[Link](https://example.com)";
      const { container } = render(
        <Streamdown
          link={{ component: CustomLink }}
          mode="static"
        >
          {markdown}
        </Streamdown>
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
    });

    it("should work with custom components prop", () => {
      const CustomLink: ComponentType<LinkComponentProps> = ({
        children,
        href,
      }) => (
        <a className="custom-link" href={href}>
          {children}
        </a>
      );

      const CustomH1: ComponentType<{ children: React.ReactNode }> = ({
        children,
      }) => <h1 className="custom-h1">{children}</h1>;

      const markdown = `# Heading
      
[Link](https://example.com)`;

      const { container } = render(
        <Streamdown
          components={{ h1: CustomH1 }}
          link={{ component: CustomLink }}
        >
          {markdown}
        </Streamdown>
      );

      const h1 = container.querySelector("h1");
      expect(h1?.className).toBe("custom-h1");

      const link = container.querySelector("a");
      expect(link?.className).toContain("custom-link");
    });
  });
});
