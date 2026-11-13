const form=document.querySelector('#contact-form'),status=document.querySelector('#form-status');
let requestId=crypto.randomUUID();
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(form.dataset.sending==='true'||!form.reportValidity())return;
  const button=form.querySelector('button[type="submit"]'),original=button.innerHTML;
  form.dataset.sending='true';button.disabled=true;button.textContent='Odosielame…';status.textContent='';delete status.dataset.error;
  try{
    const values=Object.fromEntries(new FormData(form));
    const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...values,requestId}),signal:AbortSignal.timeout(25000)});
    const result=await response.json();
    if(!response.ok||!result.sent)throw Error(result.error||'Správu sa nepodarilo odoslať. Skúste to ešte raz.');
    status.textContent='Správa je u nás. Ďakujeme, ozveme sa vám e-mailom.';form.reset();requestId=crypto.randomUUID();
  }catch(error){status.dataset.error='true';status.textContent=error.name==='TimeoutError'?'Potvrdenie trvá dlhšie. Skúste odoslanie znova alebo napíšte na info@rodulab.com.':error.name==='TypeError'?'Spojenie sa prerušilo. Skontrolujte internet a skúste to znova.':error.message;}
  finally{delete form.dataset.sending;button.disabled=false;button.innerHTML=original;}
});
form.addEventListener('input',()=>{if(form.dataset.sending!=='true')requestId=crypto.randomUUID()});
document.querySelector('#year').textContent=new Date().getFullYear();
function openPrivacy(){if(location.hash==='#sukromie')document.querySelector('#sukromie').open=true;}
window.addEventListener('hashchange',openPrivacy);openPrivacy();
