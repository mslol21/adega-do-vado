import React from 'react';
import { MessageSquare, ShieldCheck, Truck, GlassWater } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const iconMap: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare size={22} />,
  ShieldCheck: <ShieldCheck size={22} />,
  Truck: <Truck size={22} />,
  GlassWater: <GlassWater size={22} />,
};

export const SocialProof: React.FC = () => {
  const { theme, benefits } = useStore();

  return (
    <section
      className="py-12 px-4"
      style={{
        backgroundColor: theme.bgSecondary,
        borderTop: `1px solid ${theme.accent}15`,
        borderBottom: `1px solid ${theme.accent}15`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 rounded-xl transition-transform hover:-translate-y-1"
              style={{
                backgroundColor: theme.bgPrimary,
                border: `1px solid ${theme.accent}15`,
              }}
            >
              <div
                className="mt-1 p-3 rounded-lg flex-shrink-0"
                style={{ background: `${theme.accent}18`, color: theme.accent }}
              >
                {iconMap[benefit.icon]}
              </div>
              <div>
                <h3 className="font-serif font-bold mb-1 text-base" style={{ color: theme.accent }}>
                  {benefit.title}
                </h3>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
