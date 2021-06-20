import { readCertificate, readQrCode } from './lib.mjs'

let qrCode = 'HC1:...'

const decoded = await readQrCode(qrCode)

console.log('Signed by ' + decoded.issuer + ' @ ' + decoded.country)

const humanReadable = readCertificate(decoded.content)

console.log('HUMAN', humanReadable)
