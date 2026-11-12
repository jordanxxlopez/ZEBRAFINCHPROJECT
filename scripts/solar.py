"""NOAA solar position equations (Meeus-based). Returns azimuth (degrees clockwise from north) and elevation."""
import numpy as np, pandas as pd
def sun_azimuth(ts, lat, lon):
    """NOAA solar position (azimuth degrees clockwise from north) for UTC timestamps."""
    t=pd.DatetimeIndex(pd.to_datetime(ts,utc=True))
    jd=t.to_julian_date().values; T=(jd-2451545.0)/36525
    L0=(280.46646+T*(36000.76983+0.0003032*T))%360; M=357.52911+T*(35999.05029-0.0001537*T)
    e=0.016708634-T*(0.000042037+0.0000001267*T)
    C=np.sin(np.radians(M))*(1.914602-T*(0.004817+0.000014*T))+np.sin(np.radians(2*M))*(0.019993-0.000101*T)+np.sin(np.radians(3*M))*0.000289
    lam=L0+C-0.00569-0.00478*np.sin(np.radians(125.04-1934.136*T))
    eps0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60; eps=eps0+0.00256*np.cos(np.radians(125.04-1934.136*T))
    dec=np.degrees(np.arcsin(np.sin(np.radians(eps))*np.sin(np.radians(lam))))
    y=np.tan(np.radians(eps/2))**2
    eqt=4*np.degrees(y*np.sin(2*np.radians(L0))-2*e*np.sin(np.radians(M))+4*e*y*np.sin(np.radians(M))*np.cos(2*np.radians(L0))-0.5*y*y*np.sin(4*np.radians(L0))-1.25*e*e*np.sin(2*np.radians(M)))
    mins=t.hour.values*60+t.minute.values+t.second.values/60
    tst=(mins+eqt+4*lon)%1440; ha=tst/4-180
    zen=np.degrees(np.arccos(np.sin(np.radians(lat))*np.sin(np.radians(dec))+np.cos(np.radians(lat))*np.cos(np.radians(dec))*np.cos(np.radians(ha))))
    az=np.degrees(np.arccos(((np.sin(np.radians(lat))*np.cos(np.radians(zen)))-np.sin(np.radians(dec)))/(np.cos(np.radians(lat))*np.sin(np.radians(zen)))))
    az=np.where(ha>0,(az+180)%360,(540-az)%360)
    return az, 90-zen
