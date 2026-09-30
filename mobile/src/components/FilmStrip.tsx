import { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, View } from 'react-native'
import { Image } from 'expo-image'

/** A slow moving strip of real posters and faces, used behind the home title. */
export function FilmStrip({ images, height = 120, speed = 40, reverse }: { images: string[]; height?: number; speed?: number; reverse?: boolean }) {
  const x = useRef(new Animated.Value(0)).current
  const w = height * 0.72
  const gap = 8
  const list = images.slice(0, 14)
  const span = list.length * (w + gap)

  useEffect(() => {
    if (!span) return
    x.setValue(reverse ? -span : 0)
    const anim = Animated.loop(Animated.timing(x, {
      toValue: reverse ? 0 : -span,
      duration: (span / speed) * 1000,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }))
    anim.start()
    return () => anim.stop()
  }, [span, speed, reverse, x])

  if (!list.length) return null
  return (
    <View style={{ height, overflow: 'hidden', direction: 'ltr' }}>
      <Animated.View style={{ flexDirection: 'row', gap, transform: [{ translateX: x }] }}>
        {[...list, ...list].map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width: w, height, borderRadius: 8, backgroundColor: '#15151A' }} contentFit="cover" />
        ))}
      </Animated.View>
    </View>
  )
}
