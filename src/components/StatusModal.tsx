import React, { useState } from 'react';
import { UserData } from '../App';
import { CheckCircle, Moon, MinusCircle, EyeOff, Smile, Calendar, Train, Briefcase, Meh, Plane } from 'lucide-react';
import Modal from './Modal';

const StatusOption = ({ icon, title, subtitle, selected, onClick }: { icon: React.ReactNode, title: string, subtitle?: string, selected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-secondary ring-2 ring-primary' : 'bg-muted hover:bg-secondary'}`}
  >
    {icon}
    <div>
      <p className="font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

const StatusMessageOption = ({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick: () => void }) => (
  <div onClick={onClick} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-secondary">
    {icon}
    <p className="text-muted-foreground">{text}</p>
  </div>
);

export default function StatusModal({ user, onClose, onStatusUpdate }: { user: UserData, onClose: () => void, onStatusUpdate: (status: Partial<UserData>) => void }) {
  const [onlineStatus, setOnlineStatus] = useState(user.online_status || 'Online');
  const [statusMessage, setStatusMessage] = useState(user.status_message || '');

  const handleSetStatus = () => {
    onStatusUpdate({ online_status: onlineStatus, status_message: statusMessage });
    onClose();
  };

  const predefinedMessages = [
    { icon: <Calendar className="w-5 h-5 text-muted-foreground" />, text: 'In a meeting' },
    { icon: <Train className="w-5 h-5 text-muted-foreground" />, text: 'Commuting' },
    { icon: <Briefcase className="w-5 h-5 text-muted-foreground" />, text: 'Working remotely' },
    { icon: <Meh className="w-5 h-5 text-muted-foreground" />, text: 'Out sick' },
    { icon: <Plane className="w-5 h-5 text-muted-foreground" />, text: 'Vacationing' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Online status"
      size="md"
    >
      <div className="p-6 space-y-6">
        {/* Online Status Options */}
        <div className="grid grid-cols-2 gap-4">
          <StatusOption 
            icon={<CheckCircle className="w-5 h-5 text-green-500" />} 
            title="Online" 
            selected={onlineStatus === 'Online'}
            onClick={() => setOnlineStatus('Online')}
          />
          <StatusOption 
            icon={<Moon className="w-5 h-5 text-yellow-500" />} 
            title="Away" 
            selected={onlineStatus === 'Away'}
            onClick={() => setOnlineStatus('Away')}
          />
          <StatusOption 
            icon={<MinusCircle className="w-5 h-5 text-red-500" />} 
            title="Do not disturb" 
            subtitle="Mute all notifications" 
            selected={onlineStatus === 'Do not disturb'}
            onClick={() => setOnlineStatus('Do not disturb')}
          />
          <StatusOption 
            icon={<EyeOff className="w-5 h-5 text-muted-foreground" />} 
            title="Invisible" 
            subtitle="Appear offline" 
            selected={onlineStatus === 'Invisible'}
            onClick={() => setOnlineStatus('Invisible')}
          />
        </div>

        {/* Status Message */}
        <div>
          <h3 className="font-bold mb-2">Status message</h3>
          <div className="relative">
            <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="What is your status?" 
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mt-2 space-y-1">
            {predefinedMessages.map((msg, index) => (
              <StatusMessageOption key={index} icon={msg.icon} text={msg.text} onClick={() => setStatusMessage(msg.text)} />
            ))}
          </div>
        </div>

        {/* Clear Status After */}
        <div>
          <label htmlFor="clear-after" className="block font-bold mb-2">Clear status after</label>
          <select id="clear-after" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring text-foreground cursor-pointer">
            <option>Don't clear</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>Today</option>
            <option>This week</option>
          </select>
        </div>
      </div>

      <div className="p-6 bg-muted/50 border-t border-border flex justify-end items-center gap-4">
        <button onClick={() => setStatusMessage('')} className="font-semibold hover:text-foreground text-muted-foreground">Clear status message</button>
        <button onClick={handleSetStatus} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition">Set status message</button>
      </div>
    </Modal>
  );
}
