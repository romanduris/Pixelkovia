const form=document.querySelector('#login-form'),button=document.querySelector('#login-button'),status=document.querySelector('#login-status');
form.addEventListener('submit',async event=>{
  event.preventDefault();button.disabled=true;status.textContent='Overujem heslo…';
  try{
    const response=await fetch('/api/admin/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:form.elements.password.value})});
    form.elements.password.value='';
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'Prihlásenie sa nepodarilo.');
    location.replace('/admin');
  }catch(error){status.textContent=error.message;form.elements.password.focus();}
  finally{button.disabled=false;}
});
