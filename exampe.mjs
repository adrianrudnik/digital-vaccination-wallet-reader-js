import { readCertificate, readQrCode } from './lib.mjs'

const qrCode = 'HC1:...'

const decoded = await readQrCode(qrCode)

console.log('Signed by ' + decoded.issuer + ' @ ' + decoded.country)
console.log(readCertificate(decoded.content))
