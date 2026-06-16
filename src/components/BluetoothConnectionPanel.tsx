/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bluetooth, ChevronLeft } from 'lucide-react';
import { GameMode } from '../types.ts';

interface BluetoothConnectionPanelProps {
  onBack: () => void;
}

export const BluetoothConnectionPanel: React.FC<BluetoothConnectionPanelProps> = ({
  onBack
}) => {
  const [status, setStatus] = useState<string>('Idle');

  const handleConnect = async () => {
    try {
      setStatus('Requesting Bluetooth Device...');
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available on this browser.');
      }
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access']
      });
      setStatus(`Connected to ${device.name || 'Unknown Device'}. Feature simulated.`);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-[#212134]/30 p-4 rounded-xl border border-white/5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-blue-400" /> Bluetooth Mode
        </span>
        <div className="w-16"></div> {/* spacer */}
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-[#171725] rounded-xl border border-blue-500/20 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Bluetooth className="w-7 h-7" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Connect Smart Board</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          Play directly on your physical electronic chess board. Turn on your DGT, Chessnut, or Millennium board and ensure it is discoverable via Bluetooth.
        </p>

        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg border border-blue-400/50 transition-all active:scale-95 flex items-center gap-2"
        >
          <Bluetooth className="w-4 h-4" /> Scan for Devices
        </button>

        <div className="mt-4 p-3 bg-black/20 rounded-lg max-w-sm w-full text-left border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Connection Status</span>
          <span className="text-xs text-blue-300 font-mono">{status}</span>
        </div>
      </div>
    </div>
  );
};
