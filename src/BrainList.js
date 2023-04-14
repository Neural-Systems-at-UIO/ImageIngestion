import { MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}



// takes argument of itemsj
const BrainList = ({ items, CurrentJob, SetCurrentJob })  => {
    const onClick = (e) => {
      ;
      CurrentJob = e.key;
      SetCurrentJob(CurrentJob);
      console.log('brainlist currenet job', CurrentJob)

    };

    
    return (
        <Menu
        onClick={onClick}
<<<<<<< HEAD
=======
        style={{
            width: 256,
            // "minHeight":"40vh" 
        }}
>>>>>>> 4169bba2937146edf35610df2f0329089e012495
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1', 'sub2']}
        mode="inline"
        items={items}
        />
    );
    };

export default BrainList;

