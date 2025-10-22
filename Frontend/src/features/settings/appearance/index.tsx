import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Apariencia'
      desc='Personaliza la apariencia de la aplicación. Cambia automáticamente entre temas de día y noche.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
