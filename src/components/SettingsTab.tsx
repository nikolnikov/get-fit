import type { Profile, ProfileFormValues } from '../types'
import { ProfileForm } from './ProfileForm'

type SettingsTabProps = {
  profile: Profile | null
  submitting: boolean
  onSave: (values: ProfileFormValues) => void
  onLogout: () => void
}

export function SettingsTab({ profile, submitting, onSave, onLogout }: SettingsTabProps) {
  return (
    <ProfileForm
      title="Settings"
      initialValues={{
        name: profile?.name ?? '',
        age: profile?.age != null ? String(profile.age) : '',
        calorieGoal: profile?.calorieGoal != null ? String(profile.calorieGoal) : '',
        currentWeight: profile?.currentWeight != null ? String(profile.currentWeight) : '',
        weightGoal: profile?.weightGoal != null ? String(profile.weightGoal) : '',
      }}
      submitLabel="Save"
      submitting={submitting}
      onSubmit={onSave}
      footer={
        <button type="button" className="profile-form__logout" onClick={onLogout}>
          Log Out
        </button>
      }
    />
  )
}
