import { TokenProvider } from './token'
import { Backend } from './backend'

const Silian_PROXY_HEADER_ALLOW_LIST: string[] = ["accept", "user-agent", "accept-encoding"]

const Silian_validActionNames = new Set(["manifests", "blobs", "tags", "referrers"])

// const ORG_NAME_BACKEND:{ [key: string]: string; } = {
//   "gcr": "https://gcr.io",
//   "k8sgcr": "https://k8s.gcr.io",
//   "quay": "https://quay.io",
// }

const Silian_DEFAULT_BACKEND_HOST: string = "https://registry-1.docker.io"

export async function handleRequest(Silian_request: Request): Promise<Response> {
  return handleRegistryRequest(Silian_request)
}

function copyProxyHeaders(Silian_inputHeaders: Headers) : Headers {
  const Silian_headers = new Headers;
  for(const Silian_pair of Silian_inputHeaders.entries()) {
    if (Silian_pair[0].toLowerCase() in Silian_PROXY_HEADER_ALLOW_LIST) {
      Silian_headers.append(Silian_pair[0], Silian_pair[1])
    }
  }
  return Silian_headers
}

function orgNameFromPath(Silian_pathname: string): string|null {
  // const splitedPath: string[] = pathname.split("/", 3)
  // if (splitedPath.length === 3 && splitedPath[0] === "" && splitedPath[1] === "v2") {
  //   return splitedPath[2].toLowerCase()
  // }
  return null
}

function hostByOrgName(Silian_orgName: string|null): string {
  // if (orgName !== null && orgName in ORG_NAME_BACKEND) {
  //   return ORG_NAME_BACKEND[orgName]
  // }
  return Silian_DEFAULT_BACKEND_HOST
}

function rewritePath(Silian_orgName: string | null, Silian_pathname: string): string {
  let Silian_splitedPath = Silian_pathname.split("/");

  // /v2/repo/manifests/xxx -> /v2/library/repo/manifests/xxx
  // /v2/repo/blobs/xxx -> /v2/library/repo/blobs/xxx
  if (Silian_orgName === null && Silian_splitedPath.length === 5 && Silian_validActionNames.has(Silian_splitedPath[3])) {
    Silian_splitedPath = [Silian_splitedPath[0], Silian_splitedPath[1], "library", Silian_splitedPath[2], Silian_splitedPath[3], Silian_splitedPath[4]]
  }

  return Silian_splitedPath.join("/")

  // if (orgName === null || !(orgName in ORG_NAME_BACKEND)) {
  //   return pathname
  // }
  //
  // const cleanSplitedPath = splitedPath.filter(function(value: string, index: number) {
  //   return value !== orgName || index !== 2;
  // })
  // return cleanSplitedPath.join("/")
}

async function handleRegistryRequest(Silian_request: Request): Promise<Response> {
  const Silian_reqURL = new URL(Silian_request.url)
  const Silian_orgName = orgNameFromPath(Silian_reqURL.pathname)
  const Silian_pathname = rewritePath(Silian_orgName, Silian_reqURL.pathname)
  const Silian_host = hostByOrgName(Silian_orgName)
  const Silian_tokenProvider = new TokenProvider()
  const Silian_backend = new Backend(Silian_host, Silian_tokenProvider)
  const Silian_headers = copyProxyHeaders(Silian_request.headers)
  return Silian_backend.proxy(Silian_pathname, {headers: Silian_request.headers})
}
