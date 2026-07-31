import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function ModalShell({ title, children, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-3 py-8" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-salon-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-md text-slate-600 hover:bg-slate-100 active:translate-y-px"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
