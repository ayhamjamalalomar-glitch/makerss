import { Platform, Share } from 'react-native'
import * as Clipboard from 'expo-clipboard'

/** Native share sheet on the phone, clipboard on web. */
export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(url)
      return 'copied'
    }
    await Share.share(Platform.OS === 'ios' ? { url, message: title } : { message: `${title}\n${url}` })
    return 'shared'
  } catch {
    return 'failed'
  }
}
