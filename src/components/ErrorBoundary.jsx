import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f1e3] p-4 dark:bg-[#0a0a0a]">
          <div className="max-w-md rounded-2xl border border-[#e4dccb] bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]">
            <p className="text-sm font-semibold text-[#c56b5c]">⚠️ Something went wrong</p>
            <p className="mt-2 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button onClick={() => window.location.reload()} className="mt-4 w-full rounded-lg bg-[#1f6f50] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17352b] dark:bg-[#2ddfa3] dark:text-[#0a0a0a] dark:hover:bg-[#25c282]">
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
