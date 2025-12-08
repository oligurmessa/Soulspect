"use client";

import React from 'react';
import SoulspaceChat from './SoulspaceChat';

interface FloatingChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingChatPane({ isOpen, onClose }: FloatingChatPaneProps) {
  return (
    <SoulspaceChat
      mode="floating"
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}