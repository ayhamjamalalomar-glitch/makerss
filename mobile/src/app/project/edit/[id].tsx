import { useLocalSearchParams } from 'expo-router'
import { ProjectEditor } from '@/components/ProjectEditor'

export default function EditProject() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProjectEditor id={id} />
}
