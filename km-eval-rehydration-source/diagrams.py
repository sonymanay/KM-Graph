import os, math
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.dirname(os.path.abspath(__file__))
S = 2  # supersample

# palette
INK="#1b2733"; MUT="#5b6b7b"; LINE="#c4d0dc"; BG="#ffffff"
BLUE="#1f6feb"; BLUEBG="#e7f0ff"
GREEN="#2f9e44"; GREENBG="#e6f4ea"
ORANGE="#e8830c"; ORANGEBG="#fdf0df"
PURPLE="#7048e8"; PURPLEBG="#efe9fd"
TEAL="#0c8599"; TEALBG="#e0f3f6"
PINK="#d6336c"; PINKBG="#fde8ef"
GOLD="#c99400"; GOLDBG="#fbf3d6"
RED="#e03131"

def font(sz, bold=False):
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    try:
        return ImageFont.truetype(name, sz*S)
    except:
        return ImageFont.truetype("arial.ttf", sz*S)

def canvas(w,h):
    im = Image.new("RGB",(w*S,h*S),BG)
    return im, ImageDraw.Draw(im)

def save(im, name):
    w,h = im.size
    im = im.resize((w//S,h//S), Image.LANCZOS)
    im.save(os.path.join(OUT,name))
    print("saved",name, im.size)

def rr(d, box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle([c*S for c in box], radius=radius*S, fill=fill, outline=outline, width=width*S)

def text(d, xy, s, f, fill=INK, anchor="la", spacing=4):
    d.text((xy[0]*S, xy[1]*S), s, font=f, fill=fill, anchor=anchor, spacing=spacing*S)

def ctext(d, box, s, f, fill=INK):
    cx=(box[0]+box[2])/2; cy=(box[1]+box[3])/2
    d.text((cx*S,cy*S), s, font=f, fill=fill, anchor="mm", align="center")

def arrow(d, p1, p2, color=MUT, width=3, head=10):
    d.line([p1[0]*S,p1[1]*S,p2[0]*S,p2[1]*S], fill=color, width=width*S)
    ang=math.atan2(p2[1]-p1[1], p2[0]-p1[0])
    for a in (ang-0.4, ang+0.4):
        d.line([p2[0]*S,p2[1]*S,(p2[0]-head*math.cos(a))*S,(p2[1]-head*math.sin(a))*S], fill=color, width=width*S)

def box_node(d, box, title, sub, fill, bar, tf, sf):
    rr(d, box, 12, fill=fill, outline=bar, width=2)
    rr(d, [box[0],box[1],box[0]+6,box[3]], 3, fill=bar)
    cx=(box[0]+box[2])/2
    text(d,(cx, box[1]+ (box[3]-box[1])/2 - (10 if sub else 0)), title, tf, fill=INK, anchor="mm")
    if sub:
        text(d,(cx, box[1]+ (box[3]-box[1])/2 + 12), sub, sf, fill=MUT, anchor="mm")

# ---------------- Diagram 1: Rehydration Control Loop ----------------
def diagram_loop():
    W,H=1600,760
    im,d=canvas(W,H)
    tf=font(17,True); sf=font(12); hf=font(24,True); cf=font(13,True); nf=font(13)
    text(d,(W/2,34),"The KM Eval Rehydration Control Loop", hf, anchor="mm")
    text(d,(W/2,64),"Every detected gap is verified against \u201cwhat good looks like\u201d before a customer is ever exposed to it", sf, fill=MUT, anchor="mm")

    # five stages around a loop
    stages=[
        ("1  DETECT","gap found across sources",ORANGE,ORANGEBG),
        ("2  REHYDRATE","synthesize eval cases",BLUE,BLUEBG),
        ("3  RUN AGENTS","execute KM agents",PURPLE,PURPLEBG),
        ("4  SCORE","grade vs golden gates",TEAL,TEALBG),
        ("5  PROMOTE / REMEDIATE","publish or quarantine",GREEN,GREENBG),
    ]
    bw,bh=250,86; y=150
    xs=[70, 380, 690, 1000, 1290]
    centers=[]
    for i,(t,s,c,bgc) in enumerate(stages):
        x=xs[i]
        box=[x,y,x+bw,y+bh]
        box_node(d,box,t,s,bgc,c,cf,sf)
        centers.append((x+bw/2, y+bh))
        if i<len(stages)-1:
            arrow(d,(x+bw+6,y+bh/2),(xs[i+1]-6,y+bh/2),MUT,3,11)

    # feedback arc back to KM graph
    text(d,(W/2,300),"\u2193  outcome writes back to the knowledge graph & metrics store  \u2193", nf, fill=MUT, anchor="mm")

    # KM graph node (center)
    gbox=[560,360,1040,470]
    rr(d,gbox,14,fill="#f4f8fc",outline=BLUE,width=2)
    text(d,(800,398),"Self-Evolving Knowledge Graph", tf, fill=INK, anchor="mm")
    text(d,(800,428),"grounded nodes \u00b7 relationships \u00b7 citations \u00b7 versioned articles", sf, fill=MUT, anchor="mm")
    arrow(d,(800,306),(800,358),BLUE,3,11)

    # sources feeding detect
    text(d,(300,520),"SIGNALS IN", cf, fill=MUT, anchor="mm")
    srcs=["Product releases","Community","ADO work items","Similar cases","Training","Golden set"]
    sx=70
    for i,sname in enumerate(srcs):
        bx=[sx, 555, sx+235, 600]
        rr(d,bx,9,fill="#f6f8fa",outline=LINE,width=1)
        ctext(d,bx,sname,nf,fill=INK)
        sx+=250 if i<2 else 250
        if sx> W-235: sx=70; # wrap not needed
    # arrange 6 in two rows
    # (redo cleanly)
    rr(d,[0,0,0,0],0)  # noop

    # gates callout under score/promote
    gates=["groundedness \u2265 .90","faithfulness \u2265 .95","correctness \u2265 .90","freshness \u2264 30d","safety = pass"]
    gx=560; gy=640
    text(d,(800,625),"PROMOTION GATES  (all must pass)", cf, fill=INK, anchor="mm")
    gx=430
    for g in gates:
        f2=font(12,True)
        wgt=d.textlength(g,font=f2)/S+26
        rr(d,[gx,650,gx+wgt,684],8,fill=GREENBG,outline=GREEN,width=1)
        ctext(d,[gx,650,gx+wgt,684],g,font(12),fill="#1a6b2e")
        gx+=wgt+12
    save(im,"loop.png")

# redraw sources row cleanly by overriding
def diagram_loop2():
    W,H=1600,860
    im,d=canvas(W,H)
    hf=font(26,True); sf=font(12.5); cf=font(13,True); nf=font(12.5); tf=font(16,True)
    text(d,(W/2,36),"The KM Eval Rehydration Control Loop", hf, anchor="mm")
    text(d,(W/2,68),"Every detected gap is verified against \u201cwhat good looks like\u201d before a customer is ever exposed to it", sf, fill=MUT, anchor="mm")

    stages=[
        ("1  DETECT","gap found in sources",ORANGE,ORANGEBG),
        ("2  REHYDRATE","synthesize eval cases",BLUE,BLUEBG),
        ("3  RUN AGENTS","execute KM agents",PURPLE,PURPLEBG),
        ("4  SCORE","grade vs golden",TEAL,TEALBG),
        ("5  PROMOTE","publish or remediate",GREEN,GREENBG),
    ]
    bw,bh=270,90; y=120
    gap=(W-2*40-5*bw)/4
    xs=[40+i*(bw+gap) for i in range(5)]
    for i,(t,s,c,bgc) in enumerate(stages):
        x=xs[i]; box=[x,y,x+bw,y+bh]
        box_node(d,box,t,s,bgc,c,cf,sf)
        if i<4: arrow(d,(x+bw+4,y+bh/2),(xs[i+1]-4,y+bh/2),MUT,3,11)

    arrow(d,(xs[4]+bw/2,y+bh+4),(xs[4]+bw/2,y+bh+40),MUT,3,11)
    arrow(d,(xs[0]+bw/2,y+bh+40),(xs[0]+bw/2,y+bh+4),MUT,3,11)
    d.line([(xs[0]+bw/2)*S,(y+bh+40)*S,(xs[4]+bw/2)*S,(y+bh+40)*S],fill=MUT,width=3*S)
    text(d,(xs[0]+bw/2+150,y+bh+27),"continuous closed loop \u2014 repeats on every gap", nf, fill=MUT, anchor="lm")

    # KM graph
    gbox=[500,300,1100,405]
    rr(d,gbox,14,fill="#f4f8fc",outline=BLUE,width=2)
    text(d,(800,338),"Self-Evolving Knowledge Graph", tf, fill=INK, anchor="mm")
    text(d,(800,368),"grounded nodes \u00b7 relationships \u00b7 citations \u00b7 versioned articles", sf, fill=MUT, anchor="mm")
    arrow(d,(800,y+bh+42),(800,298),BLUE,3,11)
    text(d,(815,275),"promoted knowledge updates the graph", nf, fill=BLUE, anchor="lm")

    # sources
    text(d,(W/2,455),"MULTI-SOURCE SIGNALS  \u2192  feed DETECT", cf, fill=MUT, anchor="mm")
    srcs=[("Product Releases",PINK,PINKBG),("Community",PURPLE,PURPLEBG),("ADO Work Items",BLUE,BLUEBG),
          ("Similar Cases",TEAL,TEALBG),("Training",GREEN,GREENBG),("Golden Dataset",GOLD,GOLDBG)]
    sw=240; sgap=(W-2*40-3*sw)/2
    for i,(nm,c,bgc) in enumerate(srcs):
        col=i%3; row=i//3
        x=40+col*(sw+sgap); yy=485+row*70
        bx=[x,yy,x+sw,yy+52]
        rr(d,bx,10,fill=bgc,outline=c,width=1)
        ctext(d,bx,nm,font(13,True),fill=INK)

    # gates
    text(d,(W/2,650),"PROMOTION GATES  \u2014  a response must clear every gate to be published", cf, fill=INK, anchor="mm")
    gates=["groundedness \u2265 .90","faithfulness \u2265 .95","answer correctness \u2265 .90","freshness \u2264 30 days","safety = pass"]
    total=0; fw=font(12.5,True); widths=[]
    for g in gates:
        w=d.textlength(g,font=fw)/S+30; widths.append(w); total+=w
    total+=12*(len(gates)-1)
    gx=(W-total)/2
    for g,w in zip(gates,widths):
        rr(d,[gx,675,gx+w,712],9,fill=GREENBG,outline=GREEN,width=2)
        ctext(d,[gx,675,gx+w,712],g,font(12.5,True),fill="#1a6b2e")
        gx+=w+12

    text(d,(W/2,770),"Fail \u2192 gap held in a tested-but-quarantined state, remediation task opened, customer never sees an unverified answer", sf, fill=MUT, anchor="mm")
    save(im,"loop.png")

# ---------------- Diagram 2: Multi-Source Fabric ----------------
def diagram_fabric():
    W,H=1600,780
    im,d=canvas(W,H)
    hf=font(26,True); sf=font(12.5); cf=font(13,True); nf=font(12.5)
    text(d,(W/2,36),"Multi-Dimensional Eval Fabric", hf, anchor="mm")
    text(d,(W/2,68),"Six independent sources hydrate the eval corpus; the golden dataset anchors correctness while the others supply coverage, recency & real-world phrasing", sf, fill=MUT, anchor="mm")

    srcs=[("Golden Dataset","human-verified truth",GOLD,GOLDBG),
          ("Similar Cases","resolved tickets by intent",TEAL,TEALBG),
          ("Community Content","forums, Q&A, MVP blogs",PURPLE,PURPLEBG),
          ("ADO Work Items","bugs, known issues, fixes",BLUE,BLUEBG),
          ("Training / Enablement","internal modules",GREEN,GREENBG),
          ("Product Releases","notes, changelogs, deprecations",PINK,PINKBG)]
    bw,bh=250,84
    x0=40
    ys=[130+i*100 for i in range(6)]
    for i,(nm,s,c,bgc) in enumerate(srcs):
        box=[x0,ys[i],x0+bw,ys[i]+bh]
        box_node(d,box,nm,s,bgc,c,cf,sf)
        arrow(d,(x0+bw+4,ys[i]+bh/2),(560,390),c,2,9)

    # eval corpus hub
    hub=[560,320,900,460]
    rr(d,hub,16,fill="#eef4fb",outline=BLUE,width=3)
    text(d,(730,362),"Unified Eval Corpus", font(19,True), anchor="mm")
    text(d,(730,392),"deduped \u00b7 intent-tagged", sf, fill=MUT, anchor="mm")
    text(d,(730,414),"golden-anchored", sf, fill=MUT, anchor="mm")

    # to control loop
    arrow(d,(900,390),(1010,390),BLUE,3,12)
    stages=[("Rehydrate",BLUE,BLUEBG),("Run agents",PURPLE,PURPLEBG),("Score vs golden",TEAL,TEALBG),("Promote",GREEN,GREENBG)]
    sy=180
    for i,(nm,c,bgc) in enumerate(stages):
        box=[1020,sy+i*100,1300,sy+i*100+62]
        rr(d,box,10,fill=bgc,outline=c,width=2)
        ctext(d,box,nm,font(14,True),fill=INK)
        if i<3: arrow(d,(1160,sy+i*100+62),(1160,sy+(i+1)*100),MUT,2,9)
    text(d,(1160,150),"CONTROL LOOP", cf, fill=MUT, anchor="mm")

    text(d,(730,700),"No single source defines truth. Community and releases supply recency; golden guards correctness and can only be expanded through review.", sf, fill=MUT, anchor="mm")
    save(im,"fabric.png")

# ---------------- Diagram 3: Metrics & Drift ----------------
def diagram_metrics():
    W,H=1600,720
    im,d=canvas(W,H)
    hf=font(26,True); sf=font(12.5); cf=font(13,True)
    text(d,(W/2,36),"Agent Quality & Model-Drift Monitoring", hf, anchor="mm")
    text(d,(W/2,68),"Offline (golden) + online (production) eval on every sweep; drift on output-embedding distribution triggers review and auto-retrain", sf, fill=MUT, anchor="mm")

    # chart area
    cx0,cy0,cx1,cy1=80,140,1000,560
    rr(d,[cx0,cy0,cx1,cy1],10,fill="#fbfcfd",outline=LINE,width=1)
    # y grid
    yf=font(11)
    for i,val in enumerate([100,90,80,70,60]):
        yy=cy0+ (cy1-cy0)*i/4
        d.line([cx0*S,yy*S,cx1*S,yy*S],fill="#eef2f6",width=1*S)
        text(d,(cx0-10,yy),str(val)+"%",yf,fill=MUT,anchor="rm")
    import random
    random.seed(7)
    n=40
    def series(base,amp,drop=None):
        pts=[]
        for i in range(n):
            v=base+math.sin(i/3)*amp+random.uniform(-1.2,1.2)
            if drop and i>26: v-= (i-26)*drop
            pts.append(v)
        return pts
    def toxy(pts, lo=60, hi=100):
        return [(cx0+ (cx1-cx0)*i/(n-1), cy1-(cy1-cy0)*(v-lo)/(hi-lo)) for i,v in enumerate(pts)]
    gnd=series(95,1.8); cor=series(92,2.0)
    drift=[10+math.sin(i/5)*2+random.uniform(-1,1)+ (max(0,i-27)*1.1) for i in range(n)]
    # alert band for drift mapped on same axis (drift*..) draw dashed at value 25 on 0-40 scale -> map
    def drift_xy(pts):
        return [(cx0+(cx1-cx0)*i/(n-1), cy1-(cy1-cy0)*(v)/40) for i,v in enumerate(pts)]
    # alert line at drift=25
    ay=cy1-(cy1-cy0)*25/40
    for xx in range(int(cx0),int(cx1),16):
        d.line([xx*S,ay*S,(xx+8)*S,ay*S],fill=RED,width=2*S)
    text(d,(cx1-6,ay-12),"drift alert 0.25",font(11,True),fill=RED,anchor="rm")
    def poly(pts,color,w=3):
        fl=[]
        for x,y in pts: fl+=[x*S,y*S]
        d.line(fl,fill=color,width=w*S,joint="curve")
    poly(drift_xy(drift),ORANGE,3)
    poly(toxy(cor),PURPLE,3)
    poly(toxy(gnd),BLUE,3)
    # legend
    lx=cx0+10; ly=cy1+22
    for nm,c in [("Groundedness %",BLUE),("Answer correctness %",PURPLE),("Drift (PSI \u00d7100)",ORANGE)]:
        d.line([lx*S,ly*S,(lx+22)*S,ly*S],fill=c,width=4*S)
        text(d,(lx+30,ly),nm,font(12),fill=MUT,anchor="lm")
        lx+= d.textlength(nm,font=font(12))/S + 70

    # metric cards right
    cards=[("Groundedness / Faithfulness","answer is supported by cited evidence",GREEN,GREENBG),
           ("Answer Correctness","matches golden resolution",BLUE,BLUEBG),
           ("Coverage & Freshness","KM has a current grounded answer",TEAL,TEALBG),
           ("Model Drift (PSI / KL)","output distribution shift over time",ORANGE,ORANGEBG),
           ("Latency & Cost / 1k","operational efficiency",PURPLE,PURPLEBG)]
    x=1040
    for i,(t,s,c,bgc) in enumerate(cards):
        box=[x,150+i*84,1560,150+i*84+66]
        rr(d,box,10,fill=bgc,outline=c,width=1)
        rr(d,[box[0],box[1],box[0]+6,box[3]],3,fill=c)
        text(d,(x+22,box[1]+22),t,font(13,True),fill=INK,anchor="lm")
        text(d,(x+22,box[1]+45),s,font(11.5),fill=MUT,anchor="lm")
    save(im,"metrics.png")

# ---------------- Diagram 4: North Star maturity ----------------
def diagram_northstar():
    W,H=1500,520
    im,d=canvas(W,H)
    hf=font(26,True); sf=font(12.5); cf=font(14,True); nf=font(12)
    text(d,(W/2,36),"North Star \u2014 KM Eval Maturity Model", hf, anchor="mm")
    text(d,(W/2,68),"From reactive, manually-curated knowledge to a self-evolving KM verified in real time, ahead of the customer", sf, fill=MUT, anchor="mm")
    levels=[("L0","Reactive","manual articles, no evals","#adb5bd","#f1f3f5"),
            ("L1","Measured","offline golden eval, periodic","#4dabf7","#e7f5ff"),
            ("L2","Continuous","automated eval on every change","#3bc9db","#e3fafc"),
            ("L3","Gap-Driven","rehydrate evals when gaps found","#7048e8","#efe9fd"),
            ("L4","Self-Evolving","real-time, ahead-of-time, drift-controlled","#2f9e44","#e6f4ea")]
    bw=270; x0=30; step=(W-2*30-bw)/(len(levels)-1)
    baseY=180
    for i,(lv,nm,s,c,bgc) in enumerate(levels):
        x=x0+i*step; yy=baseY - i*8
        box=[x,yy,x+bw,yy+150]
        rr(d,box,12,fill=bgc,outline=c,width=2)
        text(d,(x+bw/2,yy+30),lv,font(22,True),fill=c,anchor="mm")
        text(d,(x+bw/2,yy+66),nm,cf,fill=INK,anchor="mm")
        text(d,(x+bw/2,yy+100),s,nf,fill=MUT,anchor="mm",spacing=3)
        if i<len(levels)-1:
            arrow(d,(x+bw+2,yy+70),(x+step-2,baseY-(i+1)*8+70),MUT,3,10)
    text(d,(W/2,430),"\u2192  increasing control, coverage, and speed  \u2014  target state: L4 Self-Evolving", cf, fill=INK, anchor="mm")
    save(im,"northstar.png")

diagram_loop2()
diagram_fabric()
diagram_metrics()
diagram_northstar()
print("done")
