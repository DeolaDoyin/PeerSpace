import React from "react";
import { notify } from "@/lib/notify";

type State = { hasError: boolean };

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  State
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Unhandled render error", error, info);
    try {
      notify.error("Something went wrong. Please reload the page.");
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-card p-6 rounded-lg border border-border">
            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Reloading the page may fix it.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
