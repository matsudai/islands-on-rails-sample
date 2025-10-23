# Quick Start

```sh
# Clone
git clone https://github.com/matsudai/islands-on-rails-sample.git
cd islands-on-rails-sample

# Install
bundle install
cd shared-ui && npm install && cd ..
bin/rails db:prepare db:seed

# Run
./bin/dev # => http://localhost:3000/
```

# React x Rails (+tailwindcss)

環境構築手順を示します。

## １．事前準備

事前にRuby、Node.jsを準備してください。

```sh
ruby -v # => ruby 4.0.7
node -v # => v24.14.1

gem install rails
rails -v # => Rails 8.1.4
```

## ２．フレームワークの導入

RailsとViteを導入します。

```sh
rails new islands-on-rails --css tailwind --skip-test
    # create  README.md
    # ...
    # create  db/cable_schema.rb
    # force   config/cable.yml
cd islands-on-rails

npm create vite@latest shared-ui -- --template react-ts --no-interactive
    # > npx
    # > "create-vite" shared-ui --template react-ts --no-interactive
    #
    # ◇  Scaffolding project in .../islands-on-rails/shared-ui...
    # └  Done. Now run:
    #      cd shared-ui
    #      npm install
    #      npm run dev
cd shared-ui
npm install react@~19.2.8 react-dom@~19.2.8
    # found 0 vulnerabilities
cd ..
```

## ３．ViteのLibrary Mode設定

* shared-ui/vite.config.ts

    ```diff
      export default defineConfig({
        plugins: [react()],
    +   define: {
    +     "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    +   },
    +   build: {
    +     lib: {
    +       entry: "src/index.ts",
    +       name: "shared-ui",
    +       fileName: "shared-ui",
    +       formats: ["es"],
    +     },
    +     rolldownOptions: {
    +       external: ["react", "react-dom"],
    +     },
    +     minify: "oxc",
    +     target: "es2020",
    +   },
      })
    ```

* shared-ui/src/index.ts

    ```ts
    /* Railsに公開するコンポーネントはここにエクスポートします。
    * （デフォルトのmain.tsxはViteのみでの動作確認用とします）
    */
    ```

## ４．Railsからの参照設定

* Procfile.dev (開発用)

    **注：開発中にはReactコンポーネントを変更した場合、Rails側に反映するにはRails側のJavaScriptを保存したうえで画面をリロードする必要があります。**

    ```diff
    - web: bin/rails server
    + web: bin/rails server -b 0.0.0.0
      css: bin/rails tailwindcss:watch
    + shared-ui: cd shared-ui && npm run dev
    + shared-ui-css: cd shared-ui && npm run build -- --watch
    ```

* lib/tasks/custom_assets.rake (本番用)

    Railsの本番モードでは `rails assets:precompile` するため、その処理前にESMをビルドするようにします。

    ```rb
    namespace :custom_assets do
      desc "Build shared-ui package"
      task :build_shared_ui do
        system("cd shared-ui && npm run build")
      end
    end

    # 一般的なassets:precompileタスクの前にshared-uiをビルドします。
    Rake::Task["assets:precompile"].enhance ["custom_assets:build_shared_ui"]
    ```

* app/assets/tailwind/application.css

    Rails側のTailwindCSSエントリポイントで、ViteのCSSを指定します。

    ```diff
      @import "tailwindcss";
    + @import "../../../shared-ui/src/index.css";
    ```

* config/application.rb

    importmapの参照先に、Viteアプリのビルド結果の出力先ディレクトリを追加します。

    ```diff
     module IslandsOnRails
       class Application < Rails::Application

         ...

    +     # React (Vite) components
    +     config.assets.paths << Rails.root.join("shared-ui/dist")
        end
      end
    ```

* config/importmap.rb

    ```diff
    + pin "shared-ui"
    ```

## ５．React/Railsの共通ライブラリの導入

### ５．１ 片方にしかないライブラリのバージョン確認

* React側に合わせるもの

    ```sh
    cd shared-ui

    # React, React DOM
    npm list
        # react-dom@19.2.8
        # react@19.2.8
    cd ..
    ```

* Rails側に合わせるもの

    ```sh
    # tailwindcss
    bundle list | grep tailwindcss-ruby # => 4.3.3
    ```

### ５．２ Reactへの共通ライブラリ導入

前の手順で確認したバージョンを指定します。

* tailwindcss : 4.3系

```sh
# refs https://tailwindcss.com/docs/installation/using-vite
cd shared-ui
npm install tailwindcss@~4.3.3 @tailwindcss/vite@~4.3.3
    # found 0 vulnerabilities
cd ..
```

* shared-ui/vite.config.ts

    ```diff
      import react from '@vitejs/plugin-react'
      import { defineConfig } from 'vite'
    + import tailwindcss from '@tailwindcss/vite'

      // https://vite.dev/config/
      export default defineConfig({
    -   plugins: [react()],
    +   plugins: [react(), tailwindcss()],
    ```

* shared-ui/src/index.css

    TailwindCSSを導入するとともに、衝突を避けるためデフォルトのスタイルを削除します。

    ```diff
    + @import "tailwindcss";
    - :root {
    -     ...
    - }
    - ...
    ```

* shared-ui/src/App.css
* shared-ui/src/App.tsx

    前述の理由によりデフォルトのスタイルを削除します。

    ```diff
    - .counter {
    -     ...
    - }
    - ...
    ```

    ```diff
    - import './App.css'
    ```

### ５．３ Railsへの共通ライブラリ導入

前の手順で確認したバージョンを指定します。

* react-dom : 19.2系
* react : 19.2系

```sh
./bin/importmap pin react-dom@~19.2.8/client react@~19.2.8
    # Pinning "react" to vendor/javascript/react.js via download from https://ga.jspm.io/npm:react@19.2.8/index.js
    # Pinning "react-dom/client" to vendor/javascript/react-dom/client.js via download from https://ga.jspm.io/npm:react-dom@19.2.8/client.js
    # Pinning "react-dom" to vendor/javascript/react-dom.js via download from https://ga.jspm.io/npm:react-dom@19.2.8/index.js
    # Pinning "scheduler" to vendor/javascript/scheduler.js via download from https://ga.jspm.io/npm:scheduler@0.27.0/index.js
```

## ６．Reactコンポーネントの作成とRailsでの利用

今回は例として下記条件で確かめます。

* React : `.my-component-class` および `.text-[#ff00ff]` のスタイルがRails側で反映されることを確認します。
* Rails : viewsで使われる `.my-component-class` にReact側で定義されたスタイルが当たること、Railsでのみ利用される `.text-[#00ffff]` にスタイルが反映されることを確認します。

```sh
rails generate controller pages about
    # create  app/controllers/pages_controller.rb
    # route   get "pages/about"
    # create  app/views/pages/about.html.erb
```

* config/routes.rb

    トップページからサンプル画面を表示できるようにします。

    ```diff
    - # root "posts#index"
    + root "pages#about"
    ```

* app/views/pages/about.html.erb

    ```diff
    - <div>
    + <div data-controller="my-component">
        <h1 class="font-bold text-4xl">Pages#about</h1>
    -   <p>Find me in app/views/pages/about.html.erb</p>
    +   <p>
    +     <span class="my-component-class">React (</span>
    +     <input type="number" data-my-component-target="input" name="dummy" value="10" class="w-8" />
    +     <span class="text-[#00ffff]">) Rails</span>
    +   </p>
    +   <div data-my-component-target="button" class="contents">Loading...</div>
      </div>
    ```

* app/javascript/controllers/my_component_controller.js

    ```js
    import { Controller } from "@hotwired/stimulus"
    import { createElement } from "react";
    import { createRoot } from "react-dom/client";
    import { Button } from "shared-ui";

    export default class extends Controller {
      static targets = ["input", "button"];

      connect() {
        this.root = createRoot(this.buttonTarget);
        this.inputTarget.addEventListener("input", this.render);
        this.render();
      }

      disconnect() {
        this.inputTarget.removeEventListener("input", this.render);
        this.root.unmount();
      }

      render = () => { // ※ function形式の場合は他の関数に渡すときに `this.render.bind(this)` で渡す必要があります。
        const count = Number.parseInt(this.inputTarget.value);
        this.root.render(createElement(Button, { count, onChangeCount: this.handleChangeCount }));
      };

      handleChangeCount = (count) => {
        this.inputTarget.value = count;
        this.render();
      };
    }
    ```

* shared-ui/src/Button.tsx

    ```tsx
    import { type FC } from "react";

    interface ButtonProps {
      count: number;
      onChangeCount: (count: number) => void;
    }

    export const Button: FC<ButtonProps> = (props) => {
      const { count, onChangeCount } = props;

      return (
        <button onClick={() => onChangeCount(count + 1)}>
          <span className="my-component-class">Vite (</span>
          {count}
          <span className="text-[#ff00ff]">) React</span>
        </button>
      );
    };
    ```

* shared-ui/src/index.css

    ```diff
      @import "tailwindcss";
    +
    + @layer components {
    +   .my-component-class {
    +     @apply text-blue-500;
    +   }
    + }
    ```

* shared-ui/src/index.ts

    ```ts
    export { Button } from './Button';
    ```

* shared-ui/src/App.tsx

    ```diff
    + import { Button } from './Button';

      ...

    +   <Button count={count} onChangeCount={setCount} />
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
    ```

### ６．１ 動作確認

* 新規でcloneした環境の場合

    ```sh
    # Rails
    bundle install

    # React
    cd shared-ui
    npm install
    cd ..
    ```

* サーバの起動

    ```sh
    ./bin/dev
        # React => http://localhost:5173/
        # Rails => http://localhost:3000/
    ```

### ７．その他

#### ７．１ TurboStreamとの連携

RailsではActive Jobなどのサーバ側の処理にトリガして画面更新が可能です。
グラフ用データの置換をReactへ伝えるため、カスタムイベントを定義します。

例えば「投票画面での投票（登録）にトリガして、結果画面の一覧の円グラフを更新（MyDoughnutコンポーネントの再描画）する」場合は次のようにします。

* app/javascript/application.js ※ 汎用的に使えるためアプリケーションに1つだけでOK。

    ```diff
    + Turbo.StreamActions.dispatch_event = function () {
    +   const name = this.getAttribute("event-name");
    +   const detail = JSON.parse(this.getAttribute("event-detail") || "{}");
    + 
    +   const event = new CustomEvent(name, { detail, bubbles: true });
    +   this.targetElements.forEach((target) => target.dispatchEvent(event));
    + };
    ```

* app/models/vote.rb

    一覧・グラフ用データ・通知を1つのメッセージとして配信します。

    ```rb
    class Vote < ApplicationRecord
      belongs_to :candidate, counter_cache: true

      def self.broadcast_summaries
        candidates = Candidate.order(votes_count: :desc, id: :asc)

        Turbo::StreamsChannel.broadcast_render_to(
          "summaries",
          partial: "summaries/refresh",
          locals: { candidates: }
        )
      end
    end
    ```

* app/views/summaries/_refresh.turbo_stream.erb

    データの置換後に更新を通知します。

    ```erb
    <%= turbo_stream.replace "summaries_table", partial: "summaries/summaries_table", locals: { candidates: } %>
    <%= turbo_stream.replace "summaries-chart-data", partial: "summaries/chart_data", locals: { candidates: } %>
    <%= turbo_stream_action_tag "dispatch_event", target: "summaries-chart-data", "event-name": "summaries:change", "event-detail": {}.to_json %>
    ```

* (例) app/javascript/controllers/summaries_controller.js

    ```diff
      export default class extends Controller {
        static targets = ["chart", "data"];

        connect() {
          this.chart = createRoot(this.chartTarget);
          this.render();
    +     this.element.addEventListener("summaries:change", this.render);
        }

        disconnect() {
    +     this.element.removeEventListener("summaries:change", this.render);
          this.chart.unmount();
        }

        render = () => {
          const data = JSON.parse(this.dataTarget.textContent);
          this.chart.render(createElement(MyDoughnut, { data }));
        };
      }
    ```

#### ７．２ 本番モード、開発時のSolid*利用メモ

Rails 8ではSolid Cache、Solid Queue、Solid Cableが標準で導入されます。
本アプリではSQLiteを利用し、キャッシュ、ジョブキュー、Action Cableの配信メッセージを保存します。

* config/database.yml

    マルチデータベース構成でcache、queue、cableの設定を追加します。

    ```diff
      development:
    -   <<: *default
    -   database: storage/development.sqlite3
    +   primary:
    +     <<: *default
    +     database: storage/development.sqlite3
    +   cache:
    +     <<: *default
    +     database: storage/development_cache.sqlite3
    +     migrations_paths: db/cache_migrate
    +   queue:
    +     <<: *default
    +     database: storage/development_queue.sqlite3
    +     migrations_paths: db/queue_migrate
    +   cable:
    +     <<: *default
    +     database: storage/development_cable.sqlite3
    +     migrations_paths: db/cable_migrate
    ```

* config/environments/development.rb

    開発環境でSolid CacheとSolid Queueを有効にします。

    ```diff
    - # Change to :null_store to avoid any caching.
    - config.cache_store = :memory_store
    + # Replace the default in-process memory cache store with a durable alternative.
    + config.cache_store = :solid_cache_store
    + 
    + # Replace the default in-process and non-durable queuing backend for Active Job.
    + config.active_job.queue_adapter = :solid_queue
    + config.solid_queue.connects_to = { database: { writing: :queue } }
    ```

* config/cache.yml

    ```diff
      development:
    +   database: cache
        <<: *default
    ```

* config/cable.yml

    Solid CableをデフォルトのAction Cableアダプターとして設定します。

    ```diff
    - development:
    -   adapter: async
    -
    - test:
    -   adapter: test
    -
    - production:
    + default: &default
        adapter: solid_cable
        connects_to:
          database:
            writing: cable
        polling_interval: 0.1.seconds
        message_retention: 1.day
        writer_batch_size: 4
        writer_batch_delay: 0.001.seconds
    + 
    + development:
    +   <<: *default
    + 
    + test:
    +   adapter: test
    + 
    + production:
    +   <<: *default
    ```


データベースを準備してから起動します。

```sh
bin/rails db:prepare db:seed
./bin/dev
    # 投票 => http://localhost:3000/votes
    # 集計 => http://localhost:3000/summaries
```

Solid Cableを利用すると、別プロセスからの配信も画面に反映できます。`runner` を終了する前に、`shutdown` で書き込みの完了を待ちます。

```sh
bin/rails runner 'Vote.broadcast_summaries; ActionCable.server.pubsub.shutdown'
```

本番モードは下記の手順で起動します。ローカルでの確認にはダミーのsecret_key_baseを利用します。

```sh
# 1. Build
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile db:prepare db:seed

# 2. Run
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails server -b 0.0.0.0
    # 投票 => http://localhost:3000/votes
    # 集計 => http://localhost:3000/summaries

# X. Clean
# => 終了後、開発環境に影響があるためアセットのキャッシュを削除します。
bin/rails assets:clobber
```
