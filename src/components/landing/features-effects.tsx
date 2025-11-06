import React from "react";
import { BarChart, Brain, Crosshair, FileText, Lock, History } from "lucide-react";
// Helper function for class names
const cn = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(' ');

interface FeatureProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
}

interface FeatureItem {
    title: string;
    description: string;
    icon: React.ReactNode;
}

// The main component for the features section with hover effects
export function FeaturesSectionWithHoverEffects() {
  // Soulspect features aligned to the 6 locked categories
  const features = [
  {
  title: "Capture Moments",
  description: "Frictionless, multi-modal logging—text, audio, video, images—so memories are captured as life happens.",
  icon: <Crosshair className="w-8 h-8" />,
  },
  {
  title: "Documenting Your Life",
  description: "Organize and preserve an authentic life archive with timelines, tags, and verified timestamps.",
  icon: <FileText className="w-8 h-8" />,
  },
  {
  title: "Security of Your Personal Data",
  description: "End-to-end encryption, strict access controls, and integrity safeguards—your data remains yours.",
  icon: <Lock className="w-8 h-8" />,
  },
  {
  title: "Safe Personal Intelligence",
  description: "Private AI analysis using open-source, highly capable models on protected infrastructure.",
  icon: <Brain className="w-8 h-8" />,
  },
  {
  title: "Relive & Re-Experience Moments",
  description: "High-fidelity recall and immersive playback to re-experience meaningful moments—not just remember them.",
  icon: <History className="w-8 h-8" />,
  },
  {
  title: "Self-Assess & Self-Growth",
  description: "Guided reflections, assessments, and feedback loops that translate insight into measurable progress.",
  icon: <BarChart className="w-8 h-8" />,
  },
  ];
  
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
  {features.map((feature, index) => (
  <Feature key={feature.title} {...feature} index={index} />
  ))}
  </div>
  );
  }

// The individual feature card component
const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        // Add left border for the first items in each row
        (index === 0 || index === 3) && "lg:border-l dark:border-neutral-800",
        // Add bottom border for the first row
        index < 3 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {/* Top gradient on hover */}
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {/* Bottom gradient on hover */}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-orange-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
