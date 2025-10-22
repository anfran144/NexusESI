import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Perfil'
      desc='Así es como otros te verán en el sitio.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
