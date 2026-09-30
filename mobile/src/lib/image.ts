import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { supabase } from './supabase'

export interface Picked { uri: string; width: number; height: number }

/** Opens the photo library. The crop happens in our own cropper (the iOS one is always square). */
export async function pickImage(): Promise<Picked | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false })
  if (res.canceled || !res.assets?.[0]) return null
  const a = res.assets[0]
  return { uri: a.uri, width: a.width, height: a.height }
}

export async function takePhoto(): Promise<Picked | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
  if (res.canceled || !res.assets?.[0]) return null
  const a = res.assets[0]
  return { uri: a.uri, width: a.width, height: a.height }
}

export interface CropRect { originX: number; originY: number; width: number; height: number }

/** Crops, resizes and encodes to JPEG. Returns the bytes ready for upload. */
export async function cropToJpeg(uri: string, rect: CropRect, outWidth: number): Promise<Uint8Array> {
  const ctx = ImageManipulator.manipulate(uri).crop(rect)
  if (rect.width > outWidth) ctx.resize({ width: outWidth })
  const img = await ctx.renderAsync()
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true })
  if (!out.base64) throw new Error('encode')
  return fromBase64(out.base64)
}

/** Uploads into the member's own folder (storage rules only allow that) and returns the public URL. */
export async function uploadJpeg(bucket: 'avatars' | 'works', userId: string, name: string, bytes: Uint8Array) {
  const path = `${userId}/${name}-${Date.now()}.jpg`
  const up = await supabase.storage.from(bucket).upload(path, bytes, { contentType: 'image/jpeg' })
  if (up.error) throw up.error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '')
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let o = 0
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i])
    const b = B64.indexOf(clean[i + 1])
    const c = B64.indexOf(clean[i + 2])
    const d = B64.indexOf(clean[i + 3])
    const n = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d)
    out[o++] = (n >> 16) & 255
    if (c >= 0 && o < out.length) out[o++] = (n >> 8) & 255
    if (d >= 0 && o < out.length) out[o++] = n & 255
  }
  return out.subarray(0, o)
}
