import { useEffect, useState } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { t } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { cropToJpeg, type CropRect, type Picked } from '@/lib/image'
import { Btn, Notice, Sheet, Txt } from './ui'

/**
 * Pinch and drag the photo inside the frame. The iOS picker can only crop squares, so portraits (3:4)
 * and posters (2:3) are framed here, then cut and encoded on the device before upload.
 */
export function CropSheet({ image, aspect, outWidth, title, onCancel, onDone }: {
  image: Picked | null; aspect: number; outWidth: number; title: string; onCancel: () => void; onDone: (jpeg: Uint8Array) => Promise<void>
}) {
  const { c } = useTheme()
  const { width: screenW } = useWindowDimensions()
  const FW = Math.min(screenW - 80, aspect < 0.7 ? 240 : 280)
  const FH = FW / aspect
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const w = image?.width || 1
  const h = image?.height || 1
  const s0 = Math.max(FW / w, FH / h)
  const dw0 = w * s0
  const dh0 = h * s0

  const k = useSharedValue(1)
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)
  const startK = useSharedValue(1)

  useEffect(() => { k.set(1); tx.set(0); ty.set(0); setError(null) }, [image?.uri, k, tx, ty])

  const clampT = (v: number, max: number) => {
    'worklet'
    return Math.min(max, Math.max(-max, v))
  }
  const pan = Gesture.Pan().onChange((e) => {
    const mx = (dw0 * k.get() - FW) / 2
    const my = (dh0 * k.get() - FH) / 2
    tx.set(clampT(tx.get() + e.changeX, mx))
    ty.set(clampT(ty.get() + e.changeY, my))
  })
  const pinch = Gesture.Pinch()
    .onStart(() => { startK.set(k.get()) })
    .onChange((e) => {
      const next = Math.min(5, Math.max(1, startK.get() * e.scale))
      k.set(next)
      tx.set(clampT(tx.get(), (dw0 * next - FW) / 2))
      ty.set(clampT(ty.get(), (dh0 * next - FH) / 2))
    })
  const gesture = Gesture.Simultaneous(pan, pinch)

  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: k.get() }],
  }))

  const confirm = async () => {
    if (!image) return
    setBusy(true)
    setError(null)
    try {
      const scale = s0 * k.get()
      const left = (dw0 * k.get() - FW) / 2 - tx.get()
      const top = (dh0 * k.get() - FH) / 2 - ty.get()
      const rect: CropRect = {
        originX: Math.max(0, Math.round(left / scale)),
        originY: Math.max(0, Math.round(top / scale)),
        width: Math.round(FW / scale),
        height: Math.round(FH / scale),
      }
      rect.width = Math.min(rect.width, w - rect.originX)
      rect.height = Math.min(rect.height, h - rect.originY)
      const bytes = await cropToJpeg(image.uri, rect, outWidth)
      await onDone(bytes)
    } catch {
      setError(t('لم نتمكن من رفع هذه الصورة. تحقق من الاتصال أو جرّب صورة أخرى.', 'We could not upload this image. Check your connection or try another one.'))
    }
    setBusy(false)
  }

  return (
    <Sheet visible={!!image} onClose={onCancel} title={title} scroll={false}
      footer={<Btn full busy={busy} onPress={confirm}>{t('استخدم هذه الصورة', 'Use this image')}</Btn>}>
      <GestureHandlerRootView style={{ alignItems: 'center', gap: 14 }}>
        <GestureDetector gesture={gesture}>
          <View style={{ width: FW, height: FH, borderRadius: 16, overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
            {image ? (
              <Animated.Image
                source={{ uri: image.uri }}
                style={[{ position: 'absolute', width: dw0, height: dh0, left: (FW - dw0) / 2, top: (FH - dh0) / 2 }, imgStyle]}
              />
            ) : null}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: FW / 3, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: (FW * 2) / 3, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', top: FH / 3, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', top: (FH * 2) / 3, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          </View>
        </GestureDetector>
        <Txt size={13} color={c.muted} center>{t('اسحب الصورة لتحريكها، وقرّب بإصبعين لتكبيرها.', 'Drag to move the photo, pinch to zoom.')}</Txt>
        {error && <Notice tone="error">{error}</Notice>}
      </GestureHandlerRootView>
    </Sheet>
  )
}
