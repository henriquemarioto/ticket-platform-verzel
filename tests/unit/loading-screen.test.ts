import { describe, it, expect } from "vitest";
import React from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import Loading from "@/app/loading";

describe("LoadingScreen & app/loading", () => {
  it("should render LoadingScreen with default fullScreen=true props", () => {
    const element = LoadingScreen({});
    expect(element).toBeDefined();
    expect(element.type).toBe("div");
    expect(element.props.role).toBe("status");
    expect(element.props["aria-label"]).toBe("Carregando");
    expect(element.props.className).toContain("min-h-[calc(100vh-160px)]");
    expect(element.props.className).toContain("w-full");
  });

  it("should render LoadingScreen with fullScreen=false props", () => {
    const element = LoadingScreen({ fullScreen: false });
    expect(element.props.className).toContain("py-12");
    expect(element.props.className).not.toContain("min-h-[calc(100vh-160px)]");
  });

  it("should apply custom className correctly", () => {
    const element = LoadingScreen({ className: "custom-loading-class", fullScreen: false });
    expect(element.props.className).toContain("custom-loading-class");
  });

  it("should render app/loading component calling LoadingScreen with fullScreen", () => {
    const element = Loading();
    expect(element).toBeDefined();
    expect(element.type).toBe(LoadingScreen);
    expect(element.props.fullScreen).toBe(true);
  });
});
