import { useState } from 'react'
import { Linking, Platform, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { WebView } from 'react-native-webview'
import { t } from '@/lib/i18n'
import { youtubeId } from '@/lib/thumbs'
import { PosterFallback, Txt, tap } from './ui'

const vimeoId = (url: string) => url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)?.[1] || null

/** 16:9 frame: a real frame from the video when there is one; plays YouTube and Vimeo inline, opens anything else. */
export function VideoFrame({ url, thumbnail, poster, title, onPlay }: { url: string | null; thumbnail: string | null; poster: string | null; title: string; onPlay?: () => void }) {
  const [playing, setPlaying] = useState(false)
  const [frameFailed, setFrameFailed] = useState(false)
  const yt = url ? youtubeId(url) : null
  const vm = url ? vimeoId(url) : null
  const start = url ? Number(url.match(/[?&#]t=(\d+)/)?.[1] || 0) : 0
  const embed = yt ? `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1&rel=0${start ? `&start=${start}` : ''}`
    : vm ? `https://player.vimeo.com/video/${vm}?autoplay=1&playsinline=1` : null
  const frame = yt ? `https://i.ytimg.com/vi/${yt}/${frameFailed ? 'hqdefault' : 'maxresdefault'}.jpg` : thumbnail && thumbnail !== poster ? thumbnail : null
  const canInline = !!embed && Platform.OS !== 'web'

  const play = () => {
    tap()
    onPlay?.()
    if (canInline) setPlaying(true)
    else if (url) Linking.openURL(url)
  }

  // The player sits in a page served "from" makerss.net: YouTube refuses embeds without a referring site.
  const html = embed ? `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000;height:100%}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${embed}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>` : ''

  return (
    <View accessibilityLabel={title} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0E0E12' }}>
      {playing && canInline ? (
        <WebView
          source={{ html, baseUrl: 'https://makerss.net' }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          style={{ flex: 1, backgroundColor: '#000' }}
        />
      ) : (
        <Pressable disabled={!url} onPress={play} style={{ flex: 1 }}>
          {frame ? (
            <Image source={{ uri: frame }} style={{ flex: 1 }} contentFit="cover" transition={250} onError={() => yt && setFrameFailed(true)} />
          ) : poster ? (
            <>
              <Image source={{ uri: poster }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" blurRadius={30} />
              <Image source={{ uri: poster }} style={{ flex: 1 }} contentFit="contain" />
            </>
          ) : <PosterFallback />}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          {url ? (
            <View style={{ position: 'absolute', bottom: 12, start: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', paddingStart: 3 }}>
                <Txt size={16} color="#0D0A08" center style={{ lineHeight: 20 }}>▶</Txt>
              </View>
              <View>
                <Txt size={14} weight="bold" color="#fff">{t('شاهد العمل', 'Watch')}</Txt>
                <Txt size={11} color="rgba(255,255,255,0.65)">{canInline ? t('يعمل هنا مباشرة', 'Plays right here') : t('يفتح خارج التطبيق', 'Opens outside the app')}</Txt>
              </View>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  )
}
