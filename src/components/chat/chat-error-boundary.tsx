"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
};

export class ChatErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ChatCapsule viewer error:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold">{this.props.title ?? 'The archive viewer hit an error'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Your archive data is still on your device. You can retry the viewer without uploading anything again.
          </p>
          <Button type="button" className="mt-6" onClick={this.handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Retry viewer
          </Button>
        </div>
      </div>
    );
  }
}
