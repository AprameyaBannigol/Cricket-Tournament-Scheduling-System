/**
 * Settings Page — Platform configuration
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Bell, Shield, Palette, Globe, Database,
  Save, ChevronRight, Check,
} from 'lucide-react'
import { Card, Button, SectionHeader, Input, Badge, Divider, Avatar } from '../components/ui'
import { motionPresets } from '../design/tokens'

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

const settingSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Globe },
]

function ToggleSwitch({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-ink-100">{label}</p>
        {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer ${
          enabled ? 'bg-arena-500' : 'bg-ink-700'
        }`}
      >
        <motion.div
          className="absolute top-0.75 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? 22 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [notifications, setNotifications] = useState({
    matchUpdates: true,
    newRegistrations: true,
    scheduleChanges: false,
    weeklyReport: true,
  })

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      <SectionHeader
        title="Settings"
        subtitle="Manage your account and platform preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <Card className="p-2 h-fit lg:sticky lg:top-24" hover={false}>
          <nav className="space-y-0.5">
            {settingSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSection === section.id
                    ? 'bg-arena-glow text-arena-400'
                    : 'text-ink-400 hover:text-ink-200 hover:bg-surface-overlay'
                }`}
              >
                <section.icon size={18} />
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profile' && (
            <motion.div {...motionPresets.fadeIn} className="space-y-6">
              <Card className="p-6" hover={false}>
                <h3 className="text-base font-bold text-ink-100 mb-6">Profile Information</h3>

                {/* Avatar section */}
                <div className="flex items-center gap-5 mb-8">
                  <Avatar name="Alex Morgan" size="xl" />
                  <div>
                    <p className="text-sm font-semibold text-ink-100">Alex Morgan</p>
                    <p className="text-xs text-ink-500 mb-2">Tournament Director</p>
                    <Button variant="secondary" size="sm">Change Photo</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="First Name" placeholder="Alex" defaultValue="Alex" />
                  <Input label="Last Name" placeholder="Morgan" defaultValue="Morgan" />
                  <Input label="Email" type="email" placeholder="alex@tournament.hub" defaultValue="alex@tournament.hub" />
                  <Input label="Role" placeholder="Tournament Director" defaultValue="Tournament Director" />
                  <Input label="Organisation" placeholder="Sports Management Inc." defaultValue="Sports Management Inc." />
                  <Input label="Time Zone" placeholder="UTC+5:30" defaultValue="Asia/Kolkata (UTC+5:30)" />
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-edge">
                  <Button variant="primary" icon={Save}>Save Changes</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div {...motionPresets.fadeIn}>
              <Card className="p-6" hover={false}>
                <h3 className="text-base font-bold text-ink-100 mb-1">Notification Preferences</h3>
                <p className="text-xs text-ink-500 mb-6">Choose what updates you'd like to receive</p>

                <div className="divide-y divide-edge">
                  <ToggleSwitch
                    enabled={notifications.matchUpdates}
                    onChange={v => setNotifications({ ...notifications, matchUpdates: v })}
                    label="Match Updates"
                    description="Get notified when matches start, end, or have score changes"
                  />
                  <ToggleSwitch
                    enabled={notifications.newRegistrations}
                    onChange={v => setNotifications({ ...notifications, newRegistrations: v })}
                    label="New Registrations"
                    description="Alerts when teams register for your tournaments"
                  />
                  <ToggleSwitch
                    enabled={notifications.scheduleChanges}
                    onChange={v => setNotifications({ ...notifications, scheduleChanges: v })}
                    label="Schedule Changes"
                    description="Notifications for match time or venue changes"
                  />
                  <ToggleSwitch
                    enabled={notifications.weeklyReport}
                    onChange={v => setNotifications({ ...notifications, weeklyReport: v })}
                    label="Weekly Report"
                    description="Receive a weekly summary of all tournament activity"
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div {...motionPresets.fadeIn} className="space-y-6">
              <Card className="p-6" hover={false}>
                <h3 className="text-base font-bold text-ink-100 mb-6">Security Settings</h3>
                <div className="space-y-5">
                  <Input label="Current Password" type="password" placeholder="••••••••" />
                  <Input label="New Password" type="password" placeholder="••••••••" />
                  <Input label="Confirm Password" type="password" placeholder="••••••••" />
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t border-edge">
                  <Button variant="primary" icon={Shield}>Update Password</Button>
                </div>
              </Card>

              <Card className="p-6" hover={false}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-ink-100">Two-Factor Authentication</h3>
                    <p className="text-xs text-ink-500 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="defeat" dot>Disabled</Badge>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" icon={Shield}>Enable 2FA</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div {...motionPresets.fadeIn}>
              <Card className="p-6" hover={false}>
                <h3 className="text-base font-bold text-ink-100 mb-1">Appearance</h3>
                <p className="text-xs text-ink-500 mb-6">Customise the look and feel of your dashboard</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-ink-200 mb-3">Theme</p>
                    <div className="flex gap-3">
                      {['Dark', 'Light', 'System'].map(theme => (
                        <button
                          key={theme}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                            theme === 'Dark'
                              ? 'border-arena-500 bg-arena-glow text-arena-400'
                              : 'border-edge text-ink-400 hover:border-ink-500 hover:text-ink-200'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <p className="text-sm font-medium text-ink-200 mb-3">Accent Colour</p>
                    <div className="flex gap-2">
                      {[
                        { name: 'Emerald', color: 'bg-arena-500' },
                        { name: 'Amber', color: 'bg-torch-500' },
                        { name: 'Blue', color: 'bg-pending' },
                        { name: 'Purple', color: 'bg-forfeit' },
                        { name: 'Red', color: 'bg-defeat' },
                      ].map(accent => (
                        <button
                          key={accent.name}
                          className={`w-8 h-8 rounded-full ${accent.color} transition-all cursor-pointer ring-2 ring-offset-2 ring-offset-surface-base ${
                            accent.name === 'Emerald' ? 'ring-arena-500' : 'ring-transparent hover:ring-ink-500'
                          }`}
                          title={accent.name}
                        >
                          {accent.name === 'Emerald' && <Check size={14} className="text-white mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div {...motionPresets.fadeIn}>
              <Card className="p-6" hover={false}>
                <h3 className="text-base font-bold text-ink-100 mb-1">Integrations</h3>
                <p className="text-xs text-ink-500 mb-6">Connect external services to enhance your platform</p>

                <div className="space-y-4">
                  {[
                    { name: 'Stripe Payments', desc: 'Accept tournament entry fees', connected: true },
                    { name: 'Google Calendar', desc: 'Sync match schedules', connected: false },
                    { name: 'Slack', desc: 'Send match notifications to channels', connected: true },
                    { name: 'Discord', desc: 'Live match updates for communities', connected: false },
                  ].map(integration => (
                    <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl bg-surface-overlay border border-edge">
                      <div>
                        <p className="text-sm font-semibold text-ink-100">{integration.name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{integration.desc}</p>
                      </div>
                      {integration.connected ? (
                        <Badge variant="victory" dot>Connected</Badge>
                      ) : (
                        <Button variant="secondary" size="sm">Connect</Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
