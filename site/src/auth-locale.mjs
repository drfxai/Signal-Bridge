// Localize sign-in labels and asynchronous readiness messages in all supported locales.
export const AUTH_LOCALE_JS=String.raw`
(()=>{
 const copy={
 en:['Email address','Verification code','Code from email','Ready to sign in.'],
 fa:['آدرس ایمیل','کد تأیید','کد ارسال‌شده به ایمیل','ورود به حساب آماده است.'],
 ar:['البريد الإلكتروني','رمز التحقق','الرمز المرسل إلى بريدك','يمكنك تسجيل الدخول الآن.'],
 tr:['E-posta adresi','Doğrulama kodu','E-postanıza gönderilen kod','Oturum açabilirsiniz.'],
 ru:['Адрес электронной почты','Код подтверждения','Код из письма','Можно войти в аккаунт.'],
 hi:['ईमेल पता','सत्यापन कोड','ईमेल से मिला कोड','साइन इन करने के लिए तैयार है।']
 };
 const banner=document.getElementById('serviceReadiness');
 const readyMessages=new Set(['Email, Telegram and payments are configured.',...Object.values(copy).map(v=>v[3])]);
 function render(){
  const text=copy[document.documentElement.lang]||copy.en;
  for(const [id,index] of [['email',0],['emailCode',1]]){
   const input=document.getElementById(id),label=input?.previousElementSibling;
   if(label?.tagName==='LABEL'){label.htmlFor=id;if(label.textContent!==text[index])label.textContent=text[index]}
  }
  const code=document.getElementById('emailCode');if(code)code.placeholder=text[2];
  if(banner&&readyMessages.has(banner.textContent)&&banner.textContent!==text[3])banner.textContent=text[3];
 }
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if(banner)new MutationObserver(render).observe(banner,{childList:true,characterData:true,subtree:true});
 render();
})();
`;
