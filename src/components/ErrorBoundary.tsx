"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred while rendering this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false });
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    this.setState({ hasError: false });
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
