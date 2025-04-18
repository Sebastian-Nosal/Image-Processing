import { Provider } from 'react-redux';
import { store } from './store/store';
import Canvases from './components/Canvases';
import Menu from './components/Menu';

function App() {
  return (
    <Provider store={store}>
      <div className="flex flex-row">
        <Menu />
        <Canvases />
      </div>
    </Provider>
  );
}

export default App;
