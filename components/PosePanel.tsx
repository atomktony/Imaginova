
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface PosePanelProps {
  onPoseSelect: (poseInstruction: string) => void;
  isLoading: boolean;
}

const POSE_OPTIONS = [
    "Slightly turned, 3/4 view",
    "Side profile view",
    "Walking towards camera",
    "Leaning against a wall",
    "Arms crossed confidently",
    "Hands in pockets relaxed",
    "Looking over shoulder",
    "Sitting on a stool"
];

const PosePanel: React.FC<PosePanelProps> = ({ onPoseSelect, isLoading }) => {
  return (
    <div className="mt-auto pt-6 border-t border-white/10">
      <h2 className="text-sm font-medium text-white/80 mb-3">Change Pose</h2>
      <div className="grid grid-cols-2 gap-2">
        {POSE_OPTIONS.map((pose) => (
          <button
            key={pose}
            onClick={() => onPoseSelect(pose)}
            disabled={isLoading}
            className="w-full text-center bg-white/5 border border-white/10 text-white/60 hover:text-white font-normal py-2 px-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-cyan-500/30 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pose}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PosePanel;
