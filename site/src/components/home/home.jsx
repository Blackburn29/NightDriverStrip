import {useState, useMemo, useEffect} from 'react';
import {AppBar, Toolbar, IconButton, Icon, Typography, Box} from '@mui/material'
import { CssBaseline, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles';
import {withStyles} from '@mui/styles';
import mainAppStyle from './style';
import getTheme from '../../theme/theme';
import NotificationPanel from './notifications/notifications';
import ConfigPanel from './config/config';
import StatsPanel from './statistics/stats';
import DesignerPanel from './designer/designer';

const MainApp = () => {
    const [mode, setMode] = useState('dark');
    const theme = useMemo(
        () => getTheme(mode),[mode]);
    useEffect(() => {
        const theme = localStorage.getItem('theme');
        if (theme) {
            setMode(theme);
        }
    }, []);

    // save users state to storage so the page reloads where they left off. 
    useEffect(() => {
        localStorage.setItem('theme', mode);
    }, [mode])

    return <ThemeProvider theme={theme}><CssBaseline /><AppPannel mode={mode} setMode={setMode} /></ThemeProvider>
};
const AppPannel = withStyles(mainAppStyle)(props => {
    const { classes, mode, setMode } = props;
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [stats, setStats] = useState(true);
    const [designer, setDesigner] = useState(true);
    const [statsRefreshRate, setStatsRefreshRate ] = useState(3);
    const [maxSamples, setMaxSamples ] = useState(50);
    const [animateChart, setAnimateChart ] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    // Load config from storage if it exists. else the default
    useEffect(() => {
        const config = JSON.parse(localStorage.getItem('config'));
        if (config) {
            setStats(s => config.stats != undefined ? config.stats : s);
            setDesigner(d => config.designer != undefined ? config.designer : d);
            setStatsRefreshRate(s => config.statsRefreshRate != undefined ? config.statsRefreshRate : s);
            setMaxSamples(m => config.maxSamples != undefined ? config.maxSamples : m)
            setAnimateChart(a => config.animateChart != undefined ? config.animateChart : a);
        }
    }, []);

    // save users state to storage so the page reloads where they left off. 
    useEffect(() => {
        localStorage.setItem('config', JSON.stringify({
            stats,
            designer,
            statsRefreshRate,
            animateChart,
            maxSamples 
        }));
    }, [stats, designer, statsRefreshRate, animateChart, maxSamples])

    
    const siteConfig = {
        statsRefreshRate: {
            name: "Refresh rate",
            value: statsRefreshRate,
            setter: setStatsRefreshRate,
            type: "int"
        },
        statsAnimateChange: {
            name: "Animate chart",
            value: animateChart,
            setter: setAnimateChart,
            type: "boolean"
        },
        maxSamples: {
            name: "Chart points",
            value: maxSamples,
            setter: setMaxSamples,
            type: "int"
        }
    };

    const addNotification = (level,type,target,notification) => {
        setNotifications(prevNotifs => {
            const group = prevNotifs.find(notif=>(notif.level === level) && (notif.type == type) && (notif.target === target)) || {level,type,target,notifications:[]};
            group.notifications.push({date:new Date(),notification});
            return [...prevNotifs.filter(notif => notif !== group), group];
        });
    };
    return <Box >
        <AppBar className={[classes.appbar, drawerOpened ? classes.appbarOpened : classes.appbarClosed].join(" ")} >
            <Toolbar>
                <IconButton 
                    aria-label="Open drawer" 
                    onClick={()=>setDrawerOpened(!drawerOpened)} 
                >
                    <Icon>{drawerOpened ? "chevron" : "menu"}</Icon>
                </IconButton>
                <Typography
                    className={classes.toolbarTitle}
                    component="h1"
                    variant="h6">
                        NightDriverStrip
                </Typography>
                {(notifications.length > 0) && <NotificationPanel notifications={notifications} clearNotifications={()=>setNotifications([])}/>}
            </Toolbar>
        </AppBar>
        <Drawer
            open={drawerOpened}
            variant="permanent"
            classes={{paper: [classes.drawer, !drawerOpened && classes.drawerClosed].join(" ")}}
        >
            <Box className={classes.drawerHeader}>
                <Box className={classes.displayMode}>
                    <IconButton onClick={()=>setMode(mode === "dark" ? "light" : "dark")} ><Icon>{mode === "dark" ? "dark_mode" : "light_mode"}</Icon></IconButton>
                    <ListItemText primary={(mode === "dark" ? "Dark" : "Light") + " mode"}/>
                </Box>
                <IconButton onClick={()=>setDrawerOpened(!drawerOpened)}>
                    <Icon>chevron_left</Icon>
                </IconButton>
            </Box> 
            <Divider/>
            <List>{
                [{caption:"Home", flag: designer, setter: setDesigner, icon: "home"},
                    {caption:"Statistics", flag: stats, setter: setStats, icon: "area_chart"},
                    {caption:"", flag: drawerOpened, icon: "settings", setter: setDrawerOpened}].map(item => 
                    <ListItem key={item.icon}>
                        <ListItemIcon><IconButton onClick={() => item.setter && item.setter(prevValue => !prevValue)}>
                            <Icon color="action" className={item.flag && classes.optionSelected}>{item.icon}</Icon>
                        </IconButton></ListItemIcon>
                        <ListItemText primary={item.caption}/>
                        {drawerOpened && (item.icon === "settings") && <ConfigPanel siteConfig={siteConfig} />}
                    </ListItem>)
            }</List>
        </Drawer>
        <Box className={[classes.content, drawerOpened && classes.contentShrinked].join(" ")}
            sx={{p: 10,
                pl: drawerOpened ? 30: 10}}>
            <StatsPanel siteConfig={siteConfig} open={stats} addNotification={addNotification}/> 
            <DesignerPanel siteConfig={siteConfig} open={designer} addNotification={addNotification}/>
        </Box>
    </Box>
});

export default MainApp;