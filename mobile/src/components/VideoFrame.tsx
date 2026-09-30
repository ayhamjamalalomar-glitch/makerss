import { useRef, useState } from 'react'
import { Linking, Modal, Platform, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { StatusBar } from 'expo-status-bar'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { t, useLang } from '@/lib/i18n'
import { youtubeId } from '@/lib/thumbs'
import { PosterFallback, Txt, tap } from './ui'

// The Makers player lives on the website (public/player.html) so the site and the app show the same
// player: YouTube without YouTube's title, channel, logo or suggestions, with Makers controls.
const PLAYER = 'https://makerss.net/player.html'
const vimeoId = (url: string) => url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)?.[1] || null

type PlayerMsg = { type?: string; t?: number; url?: string }
const parse = (e: WebViewMessageEvent): PlayerMsg => { try { return JSON.parse(e.nativeEvent.data) } catch { return {} } }

/** Only the player page loads inside the frame; any other page opens outside the app. */
function keepInside(req: ShouldStartLoadRequest) {
  if (req.isTopFrame === false || req.url.startsWith(PLAYER) || req.url.startsWith('about:')) return true
  Linking.openURL(req.url)
  return false
}

const webProps = {
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  allowsFullscreenVideo: false,
  scrollEnabled: false,
  bounces: false,
  originWhitelist: ['https://*', 'about:*'],
  onShouldStartLoadWithRequest: keepInside,
  style: { flex: 1, backgroundColor: '#000' },
}

/** 16:9 frame for a project's video. YouTube plays in the Makers player, Vimeo inline, anything else opens outside. */
export function VideoFrame({ url, thumbnail, poster, title, onPlay }: { url: string | null; thumbnail: string | null; poster: string | null; title: string; onPlay?: () => void }) {
  const { lang } = useLang()
  const inline = useRef<WebView>(null)
  const [full, setFull] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [frameFailed, setFrameFailed] = useState(false)
  const yt = url ? youtubeId(url) : null
  const vm = url ? vimeoId(url) : null
  const start = url ? Number(url.match(/[?&#]t=(\d+)/)?.[1] || 0) : 0
  const native = Platform.OS !== 'web'
  const frame = yt ? `https://i.ytimg.com/vi/${yt}/${frameFailed ? 'hqdefault' : 'maxresdefault'}.jpg` : thumbnail && thumbnail !== poster ? thumbnail : null
  const box = { width: '100%' as const, aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' as const, backgroundColor: '#0E0E12' }

  const still = frame ? (
    <Image source={{ uri: frame }} style={{ flex: 1 }} contentFit="cover" transition={250} onError={() => yt && setFrameFailed(true)} />
  ) : poster ? (
    <>
      <Image source={{ uri: poster }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" blurRadius={30} />
      <Image source={{ uri: poster }} style={{ flex: 1 }} contentFit="contain" />
    </>
  ) : <PosterFallback />

  // YouTube: the Makers player, with its own cover and controls.
  if (yt && native) {
    const src = `${PLAYER}?v=${yt}${start ? `&t=${start}` : ''}&lang=${lang}`
    const onMsg = (e: WebViewMessageEvent) => {
      const m = parse(e)
      if (m.type === 'play') onPlay?.()
      if (m.type === 'fullscreen') setFull(Math.max(0, Math.floor(m.t || 0)))
      if (m.type === 'open' && m.url) Linking.openURL(m.url)
    }
    const onFullMsg = (e: WebViewMessageEvent) => {
      const m = parse(e)
      if (m.type === 'exitFullscreen') {
        setFull(null)
        const at = Math.max(0, Math.floor(m.t || 0))
        inline.current?.injectJavaScript(`window.mkPlayer && (mkPlayer.seek(${at}), mkPlayer.play()); true;`)
      }
      if (m.type === 'open' && m.url) Linking.openURL(m.url)
    }
    return (
      <View accessibilityLabel={title} style={box}>
        <WebView ref={inline} source={{ uri: src }} onMessage={onMsg} startInLoadingState renderLoading={() => <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>{still}</View>} {...webProps} />
        <Modal visible={full !== null} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setFull(null)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar hidden />
            {full !== null && <WebView source={{ uri: `${PLAYER}?v=${yt}&t=${full}&lang=${lang}&autoplay=1&land=1` }} onMessage={onFullMsg} {...webProps} />}
          </View>
        </Modal>
      </View>
    )
  }

  // Vimeo: its own player without title and byline.
  const vimeo = vm ? `https://player.vimeo.com/video/${vm}?autoplay=1&playsinline=1&title=0&byline=0&portrait=0&badge=0&dnt=1` : null
  const canInline = !!vimeo && native
  const play = () => {
    tap()
    onPlay?.()
    if (canInline) setPlaying(true)
    else if (url) Linking.openURL(url)
  }
  const html = vimeo ? `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000;height:100%}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${vimeo}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>` : ''

  return (
    <View accessibilityLabel={title} style={box}>
      {playing && canInline ? (
        <WebView source={{ html, baseUrl: 'https://makerss.net' }} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} allowsFullscreenVideo style={{ flex: 1, backgroundColor: '#000' }} />
      ) : (
        <Pressable disabled={!url} onPress={play} style={{ flex: 1 }}>
          {still}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          {url ? (
            <View style={{ position: 'absolute', bottom: 12, start: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2B33D', alignItems: 'center', justifyContent: 'center', paddingStart: 3 }}>
                <Txt size={16} color="#0B0A08" center style={{ lineHeight: 20 }}>▶</Txt>
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
