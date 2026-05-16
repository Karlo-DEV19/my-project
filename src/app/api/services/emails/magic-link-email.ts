// ─────────────────────────────────────────────────────────────
// MJ Decors — Magic Link Email Template
//
// Pure builder function → returns a full HTML string.
// No side-effects, no network calls — only called by the sender.
//
// Design decisions:
//   • Dark luxury aesthetic (near-black default) matching MJ Decors brand
//   • prefers-color-scheme media query for Apple Mail dark mode override
//   • Table-based layout for maximum email client compatibility
//   • All base styles are inline — <style> block is progressive enhancement
//   • max-width 600px, mobile breakpoint at 480px
//   • Single CTA button + plain-text link fallback (accessibility + VT100 clients)
//   • Security notice block with expiry information
// ─────────────────────────────────────────────────────────────

export interface MagicLinkEmailOptions {
    recipientEmail: string
    magicLinkUrl: string
    expiresInMinutes?: number
}

export function buildMagicLinkEmail(options: MagicLinkEmailOptions): string {
    const {
        recipientEmail,
        magicLinkUrl,
        expiresInMinutes = 60,
    } = options

    const year = new Date().getFullYear()

    return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Sign In to MJ Decor 888</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    /* ── Reset ──────────────────────────────────────── */
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; }

    /* ── Dark mode (Apple Mail, some Outlook.com) ───── */
    @media (prefers-color-scheme: dark) {
      .bg-outer   { background-color: #080808 !important; }
      .bg-card    { background-color: #111111 !important; }
      .bg-notice  { background-color: #1a1a1a !important; }
      .bd-card    { border-color: #2c2c2c !important; }
      .bd-notice  { border-color: #2c2c2c !important; }
      .hr-line    { background-color: #2c2c2c !important; }
      .t-head     { color: #f0ede8 !important; }
      .t-body     { color: #a8a49e !important; }
      .t-email    { color: #d6d2cc !important; }
      .t-muted    { color: #5a5650 !important; }
      .t-footer   { color: #3a3632 !important; }
      .btn-cta    { background-color: #f0ede8 !important; color: #0a0a0a !important; }
      .lnk-fallbk { color: #b59b6e !important; }
      .t-notice   { color: #8a8480 !important; }
      .t-notice-strong { color: #d6d2cc !important; }
    }

    /* ── Mobile ─────────────────────────────────────── */
    @media only screen and (max-width: 480px) {
      .wrap-outer { padding: 24px 12px !important; }
      .wrap-card  { padding: 40px 24px 36px !important; }
      .t-logo-sub { display: none !important; }
      .btn-cta    { padding: 15px 28px !important; font-size: 10px !important; letter-spacing: 0.18em !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- ── Outer wrapper ───────────────────────────────────────────── -->
  <table class="bg-outer" width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#0c0c0c;">
    <tr>
      <td class="wrap-outer" align="center"
        style="padding:56px 24px;">

        <!-- ── Email card ──────────────────────────────────────── -->
        <table class="bg-card bd-card" width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background-color:#161616;border:1px solid #272727;">

          <!-- ┌── Top accent bar ─────────────────────────────── -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#8a7450 0%,#c9a96e 50%,#8a7450 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── Brand header ──────────────────────────────────── -->
          <tr>
            <td class="wrap-card" align="center"
              style="padding:48px 48px 0;">

              <!-- Monogram square -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="margin-bottom:18px;">
                <tr>
                  <td width="52" height="52" align="center" valign="middle"
                    style="background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:#0a0a0a;letter-spacing:-0.5px;">
                    MJ
                  </td>
                </tr>
              </table>

              <!-- Brand name -->
              <p style="margin:0 0 3px;font-size:8px;font-weight:800;letter-spacing:0.42em;text-transform:uppercase;color:#c9a96e;">
                MJ DECOR 888
              </p>
              <p class="t-logo-sub" style="margin:0;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:#4a4642;">
                WINDOW SOLUTIONS
              </p>

            </td>
          </tr>

          <!-- ── Divider ───────────────────────────────────────── -->
          <tr>
            <td style="padding:32px 48px 0;">
              <div class="hr-line" style="height:1px;background-color:#272727;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- ── Heading + body copy ───────────────────────────── -->
          <tr>
            <td align="center" style="padding:40px 48px 32px;">

              <h1 class="t-head"
                style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;letter-spacing:0.04em;color:#f0ede8;line-height:1.35;">
                Your Sign-In Link
              </h1>

              <p class="t-body"
                style="margin:0;font-size:14px;line-height:1.75;color:#8a8480;max-width:380px;text-align:center;">
                We received a request to sign in to your<br/>
                MJ Decor 888 account as<br/>
                <span class="t-email" style="color:#c4bfb8;font-weight:500;">${recipientEmail}</span>.
                <br/><br/>
                Tap the button below to continue.<br/>
                <span style="font-size:12px;color:#5a5650;">No password required.</span>
              </p>

            </td>
          </tr>

          <!-- ── CTA button ─────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:0 48px 40px;">

              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                href="${magicLinkUrl}"
                style="height:52px;v-text-anchor:middle;width:248px;"
                arcsize="0%" stroke="f" fillcolor="#f0ede8">
                <w:anchorlock/>
                <center style="color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.2em;">
                  SIGN IN TO MJ DECORS
                </center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a class="btn-cta" href="${magicLinkUrl}" target="_blank"
                style="display:inline-block;background-color:#f0ede8;color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:17px 44px;">
                Sign In to MJ Decors
              </a>
              <!--<![endif]-->

            </td>
          </tr>

          <!-- ── Plain-text link fallback ──────────────────────── -->
          <tr>
            <td align="center" style="padding:0 48px 36px;">
              <p class="t-muted"
                style="margin:0 0 8px;font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#4a4642;">
                Or copy this link
              </p>
              <p style="margin:0;word-break:break-all;text-align:center;">
                <a class="lnk-fallbk" href="${magicLinkUrl}"
                  style="font-size:11px;color:#8a7450;text-decoration:underline;line-height:1.6;">
                  ${magicLinkUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- ── Divider ───────────────────────────────────────── -->
          <tr>
            <td style="padding:0 48px 32px;">
              <div class="hr-line" style="height:1px;background-color:#272727;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- ── Security notice ───────────────────────────────── -->
          <tr>
            <td style="padding:0 48px 40px;">
              <table class="bg-notice bd-notice" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color:#1e1c1a;border:1px solid #2c2a28;padding:20px 24px;">
                <tr>
                  <td>
                    <p class="t-muted"
                      style="margin:0 0 7px;font-size:9px;font-weight:800;letter-spacing:0.28em;text-transform:uppercase;color:#4a4642;">
                      Security Notice
                    </p>
                    <p class="t-notice"
                      style="margin:0;font-size:12px;line-height:1.75;color:#6a6662;">
                      This link expires in
                      <strong class="t-notice-strong" style="color:#a8a49e;">${expiresInMinutes} minutes</strong>
                      and can only be used once.
                      <br/>If you didn&rsquo;t request this, you can safely ignore this
                      email&nbsp;&mdash; your account remains secure.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:0 48px 44px;">
              <p class="t-footer"
                style="margin:0 0 3px;font-size:8px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:#333230;">
                MJ DECOR 888
              </p>
              <p class="t-footer"
                style="margin:0;font-size:8px;letter-spacing:0.12em;color:#333230;">
                &copy; ${year} MJ Decor 888. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- └── Bottom accent bar ─────────────────────────────── -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#8a7450 0%,#c9a96e 50%,#8a7450 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
        <!-- /email-card -->

      </td>
    </tr>
  </table>
  <!-- /outer wrapper -->

</body>
</html>`
}
