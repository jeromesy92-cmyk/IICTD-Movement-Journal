import React from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';

interface AppearanceModalProps {
  theme: string;
  setTheme: (theme: string) => void;
  onClose: () => void;
}

const AppearanceModal: React.FC<AppearanceModalProps> = ({ theme, setTheme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Appearance & Accessibility</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-md font-semibold mb-4">Theme</h3>
          <div className="grid grid-cols-3 gap-4">
                        <ThemeButton icon={<Sun size={24} />} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeButton icon={<Moon size={24} />} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
            <ThemeButton icon={<Monitor size={24} />} label="System" active={theme === 'system'} onClick={() => setTheme('system')} />
          </div>

          <h3 className="text-md font-semibold mt-6 mb-4">Accessibility</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="reduce-motion">Reduce Motion</label>
              <input type="checkbox" id="reduce-motion" className="toggle-switch" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="high-contrast">High Contrast</label>
              <input type="checkbox" id="high-contrast" className="toggle-switch" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceModal;

interface ThemeButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
      active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);
