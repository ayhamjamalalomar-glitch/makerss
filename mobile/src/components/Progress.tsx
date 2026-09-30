import { Pressable, View } from 'react-native'
import { t } from '@/lib/i18n'
import { alpha, useTheme } from '@/lib/theme'
import type { Progress } from '@/lib/progress'
import { Txt, tap } from './ui'

/** The five steps to a live page, as clips on an edit timeline with a red playhead. */
export function ProgressTimeline({ progress, onStep }: { progress: Progress; onStep?: (key: string) => void }) {
  const { c } = useTheme()
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Txt display size={16}>{t('أكمل صفحتك', 'Complete your page')}</Txt>
        <Txt mono size={12} color={c.muted}>{t(`${progress.count} من 5`, `${progress.count} of 5`)}</Txt>
      </View>
      <View style={{ paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {progress.steps.map((s) => (
            <Pressable key={s.key} onPress={() => { tap(); onStep?.(s.key) }} style={{
              flex: 1, height: 50, borderRadius: 7, paddingHorizontal: 6, justifyContent: 'center',
              backgroundColor: s.done ? alpha(c, 0.22) : c.surfaceAlt,
              borderWidth: 1, borderTopWidth: s.done ? 3 : 1, borderStyle: s.done ? 'solid' : 'dashed', borderColor: s.done ? alpha(c, 0.55) : c.borderMid,
            }}>
              <Txt size={10} weight={s.done ? 'semi' : 'regular'} color={s.done ? c.text : c.muted} lines={2} center>{s.label}</Txt>
            </Pressable>
          ))}
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: -4, width: 2, start: `${Math.min(99.5, progress.ratio * 100)}%`, backgroundColor: c.rec }}>
          <View style={{ position: 'absolute', top: -2, left: -4, width: 10, height: 10, backgroundColor: c.rec, transform: [{ rotate: '45deg' }] }} />
        </View>
      </View>
    </View>
  )
}
