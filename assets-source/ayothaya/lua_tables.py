"""Data-only reader for Lua 5.1 table constructor bytecode. Never executes Lua.
Only constant/register/table operations are accepted; calls and control flow stop parsing.
"""
import struct
def read_tables(data,env=None):
    if data[:12]!=b'\x1bLuaQ\0\x01\x04\x04\x04\x08\0':raise ValueError('Unsupported Lua table format')
    p=12
    def u():
        nonlocal p
        n=struct.unpack_from('<I',data,p)[0];p+=4;return n
    def string():
        nonlocal p
        n=u();v=data[p:p+max(0,n-1)];p+=n;return v
    string();p+=12;code=[u() for _ in range(u())];constants=[]
    for _ in range(u()):
        t=data[p];p+=1
        if t==4:v=string()
        elif t==3:v=struct.unpack_from('<d',data,p)[0];p+=8
        elif t==1:v=bool(data[p]);p+=1
        elif t==0:v=None
        else:raise ValueError('Unknown constant')
        constants.append(v)
    registers={};env={} if env is None else env;pc=0
    def rk(n):return constants[n&255] if n&256 else registers.get(n)
    while pc<len(code):
        ins=code[pc];pc+=1;op=ins&63;a=(ins>>6)&255;c=(ins>>14)&511;b=(ins>>23)&511;bx=ins>>14
        if op==0:registers[a]=registers.get(b)
        elif op==1:registers[a]=constants[bx]
        elif op==2:registers[a]=bool(b)
        elif op==3:
            for i in range(a,b+1):registers[i]=None
        elif op==5:registers[a]=env.get(constants[bx],{})
        elif op==6:registers[a]=registers[b].get(rk(c))
        elif op==7:env[constants[bx]]=registers[a]
        elif op==9:registers[a][rk(b)]=rk(c)
        elif op==10:registers[a]={}
        elif op==34:
            if not c:c=code[pc];pc+=1
            for i in range(1,b+1):registers[a][(c-1)*50+i]=registers.get(a+i)
        elif op==30:break
        else:break
    return env,registers
