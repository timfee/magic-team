import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn utility", () => {
  describe("basic functionality", () => {
    it("should combine multiple class names", () => {
      const result = cn("text-red-500", "bg-blue-500", "p-4");
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("should handle single class name", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });
  });

  describe("conditional classes", () => {
    it("should handle falsy values", () => {
      const result = cn("base-class", false && "hidden", null, undefined);
      expect(result).toBe("base-class");
    });

    it("should include truthy conditional classes", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active");
      expect(result).toBe("base-class active");
    });

    it("should handle multiple conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        "button",
        isActive && "button-active",
        isDisabled && "button-disabled",
      );
      expect(result).toBe("button button-active");
    });
  });

  describe("arrays", () => {
    it("should handle array of class names", () => {
      const classes = ["text-sm", "font-bold", "text-gray-700"];
      const result = cn(classes);
      expect(result).toBe("text-sm font-bold text-gray-700");
    });

    it("should flatten nested arrays", () => {
      const result = cn(["base", ["nested", "classes"]], "final");
      expect(result).toBe("base nested classes final");
    });

    it("should handle mixed arrays with conditionals", () => {
      const isActive = true;
      const result = cn(["base", isActive && "active"], "extra");
      expect(result).toBe("base active extra");
    });
  });

  describe("objects", () => {
    it("should handle object with boolean values", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-500": false,
        "p-4": true,
      });
      expect(result).toBe("text-red-500 p-4");
    });

    it("should evaluate object values as booleans", () => {
      const result = cn({
        active: true,
        disabled: false,
        visible: 1,
        hidden: 0,
      });
      expect(result).toBe("active visible");
    });

    it("should handle mixed input with objects", () => {
      const result = cn("base", {
        active: true,
        disabled: false,
      });
      expect(result).toBe("base active");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle button variant classes", () => {
      // Using function parameters to avoid TypeScript narrowing
      function getButtonClasses(
        variant: "primary" | "secondary",
        size: "sm" | "lg",
        isDisabled: boolean,
      ): string {
        return cn(
          "button",
          {
            "button-primary": variant === "primary",
            "button-secondary": variant === "secondary",
            "button-sm": size === "sm",
            "button-lg": size === "lg",
          },
          isDisabled && "opacity-50 cursor-not-allowed",
        );
      }

      const result = getButtonClasses("primary", "lg", false);
      expect(result).toBe("button button-primary button-lg");
    });

    it("should handle form input states", () => {
      const hasError = true;
      const isFocused = false;
      const isDisabled = false;

      const result = cn(
        "input",
        "border",
        "rounded",
        {
          "border-red-500": hasError,
          "border-blue-500": isFocused && !hasError,
          "border-gray-300": !hasError && !isFocused,
          "bg-gray-100": isDisabled,
        },
      );

      expect(result).toContain("input");
      expect(result).toContain("border-red-500");
      expect(result).not.toContain("border-blue-500");
    });

    it("should handle card component classes", () => {
      const isHovered = true;
      const isSelected = false;

      const result = cn(
        "card",
        "p-4",
        "rounded-lg",
        "transition-all",
        {
          "shadow-lg scale-105": isHovered,
          "ring-2 ring-blue-500": isSelected,
        },
      );

      expect(result).toBe(
        "card p-4 rounded-lg transition-all shadow-lg scale-105",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace in class names", () => {
      const result = cn("  text-red-500  ", " bg-blue-500 ");
      // clsx preserves whitespace from individual strings
      expect(result).toBe("  text-red-500    bg-blue-500 ");
    });

    it("should handle duplicate class names", () => {
      const result = cn("text-red-500", "text-red-500");
      // clsx doesn't deduplicate, so both should be present
      expect(result).toBe("text-red-500 text-red-500");
    });

    it("should handle empty strings", () => {
      const result = cn("base", "", "final");
      expect(result).toBe("base final");
    });

    it("should handle complex nested structure", () => {
      const result = cn(
        "base",
        ["nested", [["deeply", "nested"], false && "hidden"]],
        { active: true, disabled: false },
        true && "conditional",
      );
      expect(result).toBe("base nested deeply nested active conditional");
    });
  });

  describe("type safety", () => {
    it("should accept various ClassValue types", () => {
      // This test ensures TypeScript compilation works with various types
      const stringClass = "text-red-500";
      const arrayClass = ["bg-blue-500", "p-4"];
      const objectClass = { active: true, disabled: false };
      const conditionalClass = true && "visible";

      const result = cn(
        stringClass,
        arrayClass,
        objectClass,
        conditionalClass,
      );

      expect(typeof result).toBe("string");
    });

    it("should handle undefined and null gracefully", () => {
      const maybeClass: string | undefined = undefined;
      const nullClass: string | null = null;

      const result = cn("base", maybeClass, nullClass);
      expect(result).toBe("base");
    });
  });
});
