import {
  DOMParser
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

console.log("[Created-By] @amex2189 / @EdamAme-x")

function isRelativePath(url: string): boolean {
    try {
        new URL(url);
        return false;
    } catch {
        return true;
    }
}

function convertRelativeToAbsolute(baseURL: string, relativeURL: string): string {
    const absoluteURL = new URL(relativeURL, baseURL);
    return absoluteURL.toString();
}

async function modifyHTMLContent(content: string, baseURL: string, proxyURL: string): Promise<string> {
    const dom = new DOMParser().parseFromString(content, "text/html");
    const aTags = dom.querySelectorAll("a");

    aTags.forEach((a) => {
        const href = a.getAttribute("href");
        if (href && !href.startsWith("http")) {
            const absoluteURL = convertRelativeToAbsolute(baseURL, href);
            a.setAttribute("href", proxyURL + "/" + absoluteURL);
        }else if (href.startsWith("http") || href.startsWith("//")) {
            a.setAttribute("href", proxyURL + "/" + href);
        }
    });

    const srcHrefs = dom.querySelectorAll("[src]");

    srcHrefs.forEach((tag) => {
        const href = tag.getAttribute("src");
        if (href && !href.startsWith("http")) {
            const absoluteURL = convertRelativeToAbsolute(baseURL, href);
            tag.setAttribute("src", proxyURL + "/" + absoluteURL);
        }else if (href.startsWith("http") || href.startsWith("//")) {
            tag.setAttribute("src", proxyURL + "/" + href);
        }
    });

    const actionHrefs = dom.querySelectorAll("[action]");

    actionHrefs.forEach((tag) => {
        const href = tag.getAttribute("action");
        if (href && !href.startsWith("http")) {
            const absoluteURL = convertRelativeToAbsolute(baseURL, href);
            tag.setAttribute("action", proxyURL + "/" + absoluteURL);
        }else if (href.startsWith("http") || href.startsWith("//")) {
            tag.setAttribute("action", proxyURL + "/" + href);
        }
    });

    let nonce = ""; 

    try {
        nonce = dom.querySelector("script").getAttribute("nonce") ?? "";
    }catch {}

    try {
        dom.querySelectorAll("[http-equiv='content-security-policy']").forEach(el => {
            el.remove()
        })
    }catch {}

    const scriptTag = 
`
<!-- DENO-X-PROXY -->
<script deno-x-proxy ${nonce !== "" && `nonce="${nonce}"`}>
console.log("%c[Created-By]", "color: #00cc00", "@amex2189 / @EdamAme-x")
window._open = window.open;
window.open = (target, ...args) => {
    const proxyHostname = new URL(window.location.href).origin;
    const proxyTarget = new URL(window.location.href).pathname.replace(/\\//, "");
    if (target.startsWith("http") || target.startsWith("//")) {
        const url = proxyHostname + "/" + target;
        return window._open(url, ...args);
    }else {
        const url = proxyHostname + "/" + proxyTarget + "/" + target.replace(/^\\.*\\//, "");
        return window._open(url, ...args);
    }
}
/* FETCH */
window._fetch = window.fetch;
window.fetch = (target, ...args) => {
    const proxyHostname = new URL(window.location.href).origin;
    const proxyTarget = new URL(window.location.href).pathname.replace(/\\//, "");

    if (target instanceof Request) {
        const url = proxyHostname + "/" + target.url;
        return window._fetch(url, {
            headers: target.headers,
            method: target.method,
            body: target.body ?? null
        })
    }

    if (target.startsWith("http") || target.startsWith("//")) {
        const url = proxyHostname + "/" + target;
        return window._fetch(url, ...args);
    }else {
        const url = proxyHostname + "/" + proxyTarget + "/" + target.replace(/^\\.*\\//, "");
        return window._fetch(url, ...args);
    }
}
/* OBSERVER */
const url = new URL(window.location.href);
const proxyURL = url.origin;
const baseURL = new URL(url.pathname.replace(/\\//, "")).origin;

function normalizeURL(relativeURL) {
    const trimmedRelativeURL = relativeURL.startsWith("/") ? relativeURL.slice(1) : relativeURL;
    return  baseURL + "/" + trimmedRelativeURL;
}

const observer = new MutationObserver((mutationsList, observer) => {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      document.body.querySelectorAll("*").forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const aTags = node.querySelectorAll("a");

          aTags.forEach((a) => {
            const href = a.getAttribute("href");
            if (href.includes(window.location.hostname)) return;
            if (href && !href.startsWith("http") && !href.includes(window.location.origin)) {
              const absoluteURL = normalizeURL(href);
              a.setAttribute("href", proxyURL + "/" + absoluteURL);
            } else if (href.startsWith("http") || href.startsWith("//")) {
              a.setAttribute("href", proxyURL + "/" + href);
            }
          });

          const srcHrefs = node.querySelectorAll("[src]");

          srcHrefs.forEach((tag) => {
            const href = tag.getAttribute("src");
            if (href.includes(window.location.hostname)) return;
            if (href && !href.startsWith("http") && !href.includes(window.location.origin)) {
              const absoluteURL = normalizeURL(href);
              tag.setAttribute("src", proxyURL + "/" + absoluteURL);
            } else if (href.startsWith("http") || href.startsWith("//")) {
              tag.setAttribute("src", proxyURL + "/" + href);
            }
          });

          const actionHrefs = node.querySelectorAll("[action]");

          actionHrefs.forEach((tag) => {
            const href = tag.getAttribute("action");
            if (href.includes(window.location.hostname)) return;
            if (href && !href.startsWith("http") && !href.includes(window.location.origin)) {
              const absoluteURL = normalizeURL(href);
              tag.setAttribute("action", proxyURL + "/" + absoluteURL);
            } else if (href.startsWith("http") || href.startsWith("//")) {
              tag.setAttribute("action", proxyURL + "/" + href);
            }
          });

          observer.observe(node, { childList: true, attributes: true, subtree: true });
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, attributes: true, subtree: true });
/* LOCATION */
window.location.__defineSetter__("_href", (target) => {
    const proxyHostname = new URL(window.location.href).origin;
    const proxyTarget = new URL(window.location.href).pathname.replace(/\\//, "");
    if (target.startsWith("http") || target.startsWith("//")) {
        const url = proxyHostname + "/" + target;
        return window._open(url, "_self");
    }else {
        const url = proxyHostname + "/" + proxyTarget + "/" + target.replace(/^\\.*\\//, "");
        return window._open(url, "_self");
    }
})
window.location.__defineGetter__("_href", (target) => window.location.href)
</script>
<!-- DENO-X-PROXY -->
`;
    const modifiedContentWithScript = dom.documentElement.outerHTML.replace(/location\.href/g, "location._href").replace("</body>", `${scriptTag}</body>`);
    
    return modifiedContentWithScript;
}

Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    const method = req.method;
    const params = url.searchParams;
    const headers = req.headers;
    const body = await req.text();
    const _target = url.pathname.replace(/\//, "");
    let target = _target;

    if (isRelativePath(_target) && headers.get("Referer")) {
        const targetOrigin = new URL(headers.get("Referer")).pathname.replace(/\//, "");
        try {
            target = new URL(_target, targetOrigin).toString();
        }catch {
            return new Response(`BAD REQUEST | Please access directly in \`/ + {URL}\` format.`, {
                status: 400,
            });                                                                                                                    
        }
    } else if (isRelativePath(_target)) {
        return new Response(`BAD REQUEST | / + {URL}`, {
            status: 400,
        });
    }

    let res;

    if (method === "GET" || method === "HEAD") {
        const targetURL = new URL(target);
        targetURL.search = params.toString();
        res = await fetch(targetURL, {
            headers: headers,
            method: method,
        });
    } else {
        res = await fetch(target, {
            method: method,
            headers: headers,
            body: body,
        });
    }

    if (res.headers.get("content-type")?.includes("text/html")) {
        const content = await res.text();
        const modifiedContent = await modifyHTMLContent(content, target, "//" + url.hostname);
        res = new Response(modifiedContent, {
            ...res,        
            status: res.status,
            headers: res.headers,
        });
    }

    if (res.headers.get("content-type")?.includes("text/javascript") || res.headers.get("content-type")?.includes("application/javascript")) {
        const content = await res.text();
        const modifiedContent = content.replace(/location\.href/g, "location._href");
        res = new Response(modifiedContent, {
            ...res,        
            status: res.status,
            headers: res.headers,
        });
    }

    return new Response(await res.blob(), {
        ...res,        
        headers: {
            ...res.headers,
            "Content-Security-Policy": ""
        },
    });
});
